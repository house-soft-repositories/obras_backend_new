import { randomUUID } from 'node:crypto';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import type IAttachmentRepository from '@/modules/attachments/adapters/attachment_repository.interface';
import AttachmentEntity from '@/modules/attachments/domain/entities/attachment.entity';
import { ATTACHMENT_ENTITY_TYPE } from '@/modules/attachments/domain/enums/attachment_entity_type.enum';
import IContratoRepository from '@/modules/contratos/adapters/contrato_repository.interface';
import IIniciarUploadTermoParalisacaoUseCase, {
  IniciarUploadTermoParalisacaoParam,
  UploadTermoParalisacaoIniciado,
} from '@/modules/contratos/domain/usecase/iniciar_upload_termo_paralisacao.usecase';
import ParalisacaoRepositoryException from '@/modules/contratos/exceptions/paralisacao_repository.exception';
import IStorageService from '@/modules/storage/adapters/storage_service.interface';
import { buildStorageKey } from '@/modules/storage/infra/storage/storage_key';

export default class IniciarUploadTermoParalisacaoService
  implements IIniciarUploadTermoParalisacaoUseCase
{
  constructor(
    private readonly contratoRepo: IContratoRepository,
    private readonly attachments: IAttachmentRepository,
    private readonly storage: IStorageService,
    private readonly tenantContext: TenantContext,
  ) {}

  async execute(
    param: IniciarUploadTermoParalisacaoParam,
  ): AsyncResult<AppException, UploadTermoParalisacaoIniciado> {
    try {
      const contrato = await this.contratoRepo.findById(param.contratoId);
      if (contrato.isLeft()) return left(contrato.value);
      if (!contrato.value)
        return left(
          new ParalisacaoRepositoryException({
            code: ErrorCodeConstants.CONTRATO_NOT_FOUND,
            statusCode: 404,
          }),
        );

      const prefix = this.tenantContext.require().schemaName;
      const storageKey = buildStorageKey(
        prefix,
        'contrato-paralisacao',
        param.contratoId,
        `${randomUUID()}-${param.nomeOriginal}`,
      );
      const attachment = AttachmentEntity.create({
        fileUrl: storageKey,
        originalName: param.nomeOriginal,
        entityType: ATTACHMENT_ENTITY_TYPE.CONTRATO,
        entityId: param.contratoId,
        createdBy: param.usuarioId,
      });
      const saved = await this.attachments.save(attachment);
      if (saved.isLeft()) return left(saved.value);

      const url = await this.storage.getUploadUrl(storageKey, param.mimeType);
      if (url.isLeft()) {
        await this.attachments.deleteById(saved.value.id);
        return left(url.value);
      }

      return right({
        attachmentId: saved.value.id,
        storageKey,
        urlUpload: url.value,
      });
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(
        new ParalisacaoRepositoryException({
          code: ErrorCodeConstants.PARALISACAO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }
}
