import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IArquivoRepository from '@/modules/documentos/adapters/arquivo_repository.interface';
import IGerarDownloadUseCase, {
  DownloadUrl,
  GerarDownloadParam,
} from '@/modules/documentos/domain/usecase/gerar_download.usecase';
import ArquivoRepositoryException from '@/modules/documentos/exceptions/arquivo_repository.exception';
import ArquivoServiceException from '@/modules/documentos/exceptions/arquivo_service.exception';
import IStorageService from '@/modules/storage/adapters/storage_service.interface';

export default class GerarDownloadService implements IGerarDownloadUseCase {
  constructor(
    private readonly arquivos: IArquivoRepository,
    private readonly storage: IStorageService,
  ) {}

  async execute(
    param: GerarDownloadParam,
  ): AsyncResult<AppException, DownloadUrl> {
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
      if (!found.value.confirmado)
        return left(
          new ArquivoServiceException({
            code: ErrorCodeConstants.ARQUIVO_INVALID_INPUT,
            statusCode: 422,
          }),
        );
      const url = await this.storage.getDownloadUrl(
        found.value.storageKey,
        found.value.nomeOriginal,
      );
      if (url.isLeft()) return left(url.value);
      return right({ url: url.value });
    } catch (error) {
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
