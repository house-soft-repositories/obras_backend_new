import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import type IAttachmentRepository from '@/modules/attachments/adapters/attachment_repository.interface';
import AttachmentEntity from '@/modules/attachments/domain/entities/attachment.entity';
import IArquivoRepository from '@/modules/documentos/adapters/arquivo_repository.interface';
import IPastaRepository from '@/modules/documentos/adapters/pasta_repository.interface';
import ArquivoEntity from '@/modules/documentos/domain/entities/arquivo.entity';
import IMoverArquivoUseCase, {
  MoverArquivoParam,
} from '@/modules/documentos/domain/usecase/mover_arquivo.usecase';
import ArquivoDomainException from '@/modules/documentos/exceptions/arquivo_domain.exception';
import ArquivoRepositoryException from '@/modules/documentos/exceptions/arquivo_repository.exception';
import ArquivoServiceException from '@/modules/documentos/exceptions/arquivo_service.exception';
import PastaRepositoryException from '@/modules/documentos/exceptions/pasta_repository.exception';
import { buildDocumentStorageKey } from '@/modules/documentos/infra/storage/document_storage_key';
import IStorageService from '@/modules/storage/adapters/storage_service.interface';

export default class MoverArquivoService implements IMoverArquivoUseCase {
  constructor(
    private readonly arquivos: IArquivoRepository,
    private readonly pastas: IPastaRepository,
    private readonly attachments: IAttachmentRepository,
    private readonly storage: IStorageService,
    private readonly tenantContext: TenantContext,
  ) {}

  async execute(
    param: MoverArquivoParam,
  ): AsyncResult<AppException, ArquivoEntity> {
    try {
      const found = await this.arquivos.findById(param.arquivoId);
      if (found.isLeft()) return left(found.value);
      if (!found.value)
        return left(
          new ArquivoRepositoryException({
            code: ErrorCodeConstants.ARQUIVO_NOT_FOUND,
            statusCode: 404,
          }),
        );
      const destino = await this.pastas.findById(param.pastaDestinoId);
      if (destino.isLeft()) return left(destino.value);
      if (!destino.value)
        return left(
          new PastaRepositoryException({
            code: ErrorCodeConstants.PASTA_NOT_FOUND,
            statusCode: 404,
          }),
        );
      if (destino.value.obraId !== found.value.obraId)
        return left(
          new ArquivoServiceException({
            code: ErrorCodeConstants.ARQUIVO_MOVE_FORBIDDEN,
            statusCode: 422,
          }),
        );
      if (found.value.pastaId === destino.value.id)
        return this.arquivos.save(found.value);

      const novaKey = buildDocumentStorageKey(
        this.tenantContext.require().schemaName,
        found.value.obraId,
        destino.value.id,
        found.value.nomeOriginal,
      );
      const copied = await this.storage.copyObject(
        found.value.storageKey,
        novaKey,
      );
      if (copied.isLeft()) return left(copied.value);

      const originalKey = found.value.storageKey;
      const moved = found.value.mover(destino.value.id, novaKey);
      const saved = await this.arquivos.save(moved);
      if (saved.isLeft()) {
        await this.storage.removeObject(novaKey);
        return left(saved.value);
      }

      if (saved.value.attachmentId) {
        const attachment = await this.attachments.findById(
          saved.value.attachmentId,
        );
        if (attachment.isLeft()) {
          await this.arquivos.save(found.value);
          await this.storage.removeObject(novaKey);
          return left(attachment.value);
        }
        const updatedAttachment = AttachmentEntity.fromData({
          ...attachment.value.toObject(),
          fileUrl: novaKey,
          updatedBy: param.usuarioId,
          updatedAt: new Date(),
        });
        const attachmentSaved = await this.attachments.save(updatedAttachment);
        if (attachmentSaved.isLeft()) {
          await this.arquivos.save(found.value);
          await this.storage.removeObject(novaKey);
          return left(attachmentSaved.value);
        }
      }

      const removed = await this.storage.removeObject(originalKey);
      if (removed.isLeft()) return left(removed.value);
      return saved;
    } catch (error) {
      if (error instanceof ArquivoDomainException) return left(error);
      if (error instanceof AppException) return left(error);
      return left(
        new ArquivoServiceException({
          code: ErrorCodeConstants.ARQUIVO_INVALID_INPUT,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }
}
