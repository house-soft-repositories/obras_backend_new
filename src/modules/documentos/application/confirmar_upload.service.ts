import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import type IAttachmentRepository from '@/modules/attachments/adapters/attachment_repository.interface';
import AttachmentEntity from '@/modules/attachments/domain/entities/attachment.entity';
import { ATTACHMENT_ENTITY_TYPE } from '@/modules/attachments/domain/enums/attachment_entity_type.enum';
import IArquivoRepository from '@/modules/documentos/adapters/arquivo_repository.interface';
import ArquivoEntity from '@/modules/documentos/domain/entities/arquivo.entity';
import IConfirmarUploadUseCase, {
  ConfirmarUploadParam,
} from '@/modules/documentos/domain/usecase/confirmar_upload.usecase';
import ArquivoDomainException from '@/modules/documentos/exceptions/arquivo_domain.exception';
import ArquivoRepositoryException from '@/modules/documentos/exceptions/arquivo_repository.exception';
import ArquivoServiceException from '@/modules/documentos/exceptions/arquivo_service.exception';

export default class ConfirmarUploadService implements IConfirmarUploadUseCase {
  constructor(
    private readonly arquivos: IArquivoRepository,
    private readonly attachments: IAttachmentRepository,
  ) {}

  async execute(
    param: ConfirmarUploadParam,
  ): AsyncResult<AppException, ArquivoEntity> {
    try {
      if (!Number.isInteger(param.tamanhoBytes) || param.tamanhoBytes < 0)
        return left(
          new ArquivoServiceException({
            code: ErrorCodeConstants.ARQUIVO_CONFIRM_FAILED,
            statusCode: 400,
          }),
        );
      const found = await this.arquivos.findById(param.arquivoId);
      if (found.isLeft()) return left(found.value);
      if (!found.value)
        return left(
          new ArquivoRepositoryException({
            code: ErrorCodeConstants.ARQUIVO_NOT_FOUND,
            statusCode: 404,
          }),
        );
      const confirmado = found.value.confirmar(
        String(param.tamanhoBytes),
        param.mimeType ?? null,
      );
      if (!confirmado.attachmentId) {
        const espelho = AttachmentEntity.create({
          fileUrl: confirmado.storageKey,
          originalName: confirmado.nomeOriginal,
          entityType: ATTACHMENT_ENTITY_TYPE.DOCUMENTO,
          entityId: confirmado.id,
          createdBy: confirmado.enviadoPorUsuarioId,
        });
        const mirrorSaved = await this.attachments.save(espelho);
        if (mirrorSaved.isLeft())
          return left(
            new ArquivoServiceException({
              code: ErrorCodeConstants.ARQUIVO_CONFIRM_FAILED,
              statusCode: 500,
              cause: mirrorSaved.value,
            }),
          );
        return this.arquivos.save(
          confirmado.vincularAttachment(mirrorSaved.value.id),
        );
      }
      return this.arquivos.save(confirmado);
    } catch (error) {
      if (error instanceof ArquivoDomainException) return left(error);
      if (error instanceof AppException) return left(error);
      return left(
        new ArquivoServiceException({
          code: ErrorCodeConstants.ARQUIVO_CONFIRM_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }
}
