import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import type IAttachmentRepository from '@/modules/attachments/adapters/attachment_repository.interface';
import AttachmentEntity from '@/modules/attachments/domain/entities/attachment.entity';
import { ATTACHMENT_ENTITY_TYPE } from '@/modules/attachments/domain/enums/attachment_entity_type.enum';
import IArquivoRepository from '@/modules/documentos/adapters/arquivo_repository.interface';
import IPastaRepository from '@/modules/documentos/adapters/pasta_repository.interface';
import ArquivoEntity from '@/modules/documentos/domain/entities/arquivo.entity';
import IUploadDiretoUseCase, {
  UploadDiretoParam,
} from '@/modules/documentos/domain/usecase/upload_direto.usecase';
import ArquivoDomainException from '@/modules/documentos/exceptions/arquivo_domain.exception';
import ArquivoServiceException from '@/modules/documentos/exceptions/arquivo_service.exception';
import PastaRepositoryException from '@/modules/documentos/exceptions/pasta_repository.exception';
import { buildDocumentStorageKey } from '@/modules/documentos/infra/storage/document_storage_key';
import IStorageService from '@/modules/storage/adapters/storage_service.interface';

export default class UploadDiretoService implements IUploadDiretoUseCase {
  constructor(
    private readonly pastas: IPastaRepository,
    private readonly arquivos: IArquivoRepository,
    private readonly attachments: IAttachmentRepository,
    private readonly storage: IStorageService,
    private readonly tenantContext: TenantContext,
  ) {}

  async execute(
    param: UploadDiretoParam,
  ): AsyncResult<AppException, ArquivoEntity[]> {
    try {
      if (!param.files || param.files.length < 1)
        return left(
          new ArquivoServiceException({
            code: ErrorCodeConstants.ARQUIVO_INVALID_INPUT,
            statusCode: 400,
          }),
        );
      const found = await this.pastas.findById(param.pastaId);
      if (found.isLeft()) return left(found.value);
      if (!found.value)
        return left(
          new PastaRepositoryException({
            code: ErrorCodeConstants.PASTA_NOT_FOUND,
            statusCode: 404,
          }),
        );
      const pasta = found.value;
      const prefix = this.tenantContext.require().schemaName;
      const salvos: ArquivoEntity[] = [];
      for (const file of param.files) {
        if (!file?.buffer?.length || !file.size)
          return left(
            new ArquivoServiceException({
              code: ErrorCodeConstants.ARQUIVO_UPLOAD_FAILED,
              statusCode: 400,
            }),
          );
        const key = buildDocumentStorageKey(
          prefix,
          pasta.obraId,
          pasta.id,
          file.originalName,
        );
        const uploaded = await this.storage.putObject({
          key,
          buffer: file.buffer,
          mimetype: file.mimetype,
          size: file.size,
        });
        if (uploaded.isLeft()) return left(uploaded.value);
        const entity = ArquivoEntity.create({
          obraId: pasta.obraId,
          pastaId: pasta.id,
          nome: file.originalName,
          descricao: null,
          nomeOriginal: file.originalName,
          mimeType: file.mimetype,
          tamanhoBytes: String(file.size),
          storageKey: uploaded.value,
          attachmentId: null,
          enviadoPorUsuarioId: param.usuarioId,
        });
        const espelho = AttachmentEntity.create({
          fileUrl: uploaded.value,
          originalName: file.originalName,
          entityType: ATTACHMENT_ENTITY_TYPE.DOCUMENTO,
          entityId: entity.id,
          createdBy: param.usuarioId,
        });
        const mirrorSaved = await this.attachments.save(espelho);
        if (mirrorSaved.isLeft()) {
          await this.storage.removeObject(uploaded.value);
          return left(mirrorSaved.value);
        }
        const saved = await this.arquivos.save(
          entity.vincularAttachment(mirrorSaved.value.id),
        );
        if (saved.isLeft()) {
          await this.attachments.deleteById(mirrorSaved.value.id);
          await this.storage.removeObject(uploaded.value);
          return left(saved.value);
        }
        salvos.push(saved.value);
      }
      return right(salvos);
    } catch (error) {
      if (error instanceof ArquivoDomainException) return left(error);
      if (error instanceof AppException) return left(error);
      return left(
        new ArquivoServiceException({
          code: ErrorCodeConstants.ARQUIVO_UPLOAD_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }
}
