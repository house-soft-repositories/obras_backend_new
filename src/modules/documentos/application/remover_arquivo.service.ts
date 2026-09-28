import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import { unit, type Unit } from '@/core/types/unit';
import type IAttachmentRepository from '@/modules/attachments/adapters/attachment_repository.interface';
import IArquivoRepository from '@/modules/documentos/adapters/arquivo_repository.interface';
import IRemoverArquivoUseCase, {
  RemoverArquivoParam,
} from '@/modules/documentos/domain/usecase/remover_arquivo.usecase';
import ArquivoRepositoryException from '@/modules/documentos/exceptions/arquivo_repository.exception';
import ArquivoServiceException from '@/modules/documentos/exceptions/arquivo_service.exception';
import IStorageService from '@/modules/storage/adapters/storage_service.interface';

export default class RemoverArquivoService implements IRemoverArquivoUseCase {
  constructor(
    private readonly arquivos: IArquivoRepository,
    private readonly attachments: IAttachmentRepository,
    private readonly storage: IStorageService,
  ) {}

  async execute(param: RemoverArquivoParam): AsyncResult<AppException, Unit> {
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
      const arquivo = found.value;
      const deleted = await this.arquivos.deleteById(arquivo.id);
      if (deleted.isLeft()) return left(deleted.value);
      if (arquivo.attachmentId) {
        const attachmentDeleted = await this.attachments.deleteById(
          arquivo.attachmentId,
        );
        if (attachmentDeleted.isLeft()) return left(attachmentDeleted.value);
      }
      const removed = await this.storage.removeObject(arquivo.storageKey);
      if (removed.isLeft()) return left(removed.value);
      return right(unit);
    } catch (error) {
      if (error instanceof AppException) return left(error);
      return left(
        new ArquivoServiceException({
          code: ErrorCodeConstants.ARQUIVO_DELETE_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }
}
