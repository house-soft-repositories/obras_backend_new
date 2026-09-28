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
import IIniciarUploadUseCase, {
  IniciarUploadParam,
  UploadIniciado,
} from '@/modules/documentos/domain/usecase/iniciar_upload.usecase';
import ArquivoDomainException from '@/modules/documentos/exceptions/arquivo_domain.exception';
import ArquivoServiceException from '@/modules/documentos/exceptions/arquivo_service.exception';
import PastaRepositoryException from '@/modules/documentos/exceptions/pasta_repository.exception';
import { buildDocumentStorageKey } from '@/modules/documentos/infra/storage/document_storage_key';
import IStorageService from '@/modules/storage/adapters/storage_service.interface';

export default class IniciarUploadService implements IIniciarUploadUseCase {
  constructor(
    private readonly pastas: IPastaRepository,
    private readonly arquivos: IArquivoRepository,
    private readonly attachments: IAttachmentRepository,
    private readonly storage: IStorageService,
    private readonly tenantContext: TenantContext,
  ) {}

  async execute(
    param: IniciarUploadParam,
  ): AsyncResult<AppException, UploadIniciado[]> {
    try {
      if (!param.arquivos || param.arquivos.length < 1)
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
      const iniciados: UploadIniciado[] = [];
      for (const item of param.arquivos) {
        const key = buildDocumentStorageKey(
          prefix,
          pasta.obraId,
          pasta.id,
          item.nomeOriginal,
        );
        const entity = ArquivoEntity.create({
          obraId: pasta.obraId,
          pastaId: pasta.id,
          nome: item.nome,
          descricao: item.descricao ?? null,
          nomeOriginal: item.nomeOriginal,
          mimeType: item.mimeType,
          tamanhoBytes: null,
          storageKey: key,
          attachmentId: null,
          enviadoPorUsuarioId: param.usuarioId,
        });
        const saved = await this.arquivos.save(entity);
        if (saved.isLeft()) return left(saved.value);
        const attachment = AttachmentEntity.create({
          fileUrl: key,
          originalName: item.nomeOriginal,
          entityType: ATTACHMENT_ENTITY_TYPE.DOCUMENTO,
          entityId: saved.value.id,
          createdBy: param.usuarioId,
        });
        const attachmentSaved = await this.attachments.save(attachment);
        if (attachmentSaved.isLeft()) {
          await this.arquivos.deleteById(saved.value.id);
          return left(attachmentSaved.value);
        }
        const linked = await this.arquivos.save(
          saved.value.vincularAttachment(attachmentSaved.value.id),
        );
        if (linked.isLeft()) {
          await this.attachments.deleteById(attachmentSaved.value.id);
          await this.arquivos.deleteById(saved.value.id);
          return left(linked.value);
        }
        const url = await this.storage.getUploadUrl(key, item.mimeType);
        if (url.isLeft()) {
          await this.attachments.deleteById(attachmentSaved.value.id);
          await this.arquivos.deleteById(saved.value.id);
          return left(url.value);
        }
        iniciados.push({
          arquivoId: linked.value.id,
          nome: linked.value.nome,
          storageKey: key,
          urlUpload: url.value,
        });
      }
      return right(iniciados);
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
