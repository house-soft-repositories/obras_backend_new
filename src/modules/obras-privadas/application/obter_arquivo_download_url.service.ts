import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IObraPrivadaArquivoRepository from '@/modules/obras-privadas/adapters/obra_privada_arquivo_repository.interface';
import IObterArquivoDownloadUrlUseCase, {
  ArquivoDownloadUrl,
  ObterArquivoDownloadUrlParam,
} from '@/modules/obras-privadas/domain/usecase/obter_arquivo_download_url.usecase';
import ObraPrivadaServiceException from '@/modules/obras-privadas/exceptions/obra_privada_service.exception';
import IStorageService from '@/modules/storage/adapters/storage_service.interface';

export default class ObterArquivoDownloadUrlService implements IObterArquivoDownloadUrlUseCase {
  constructor(
    private readonly arquivos: IObraPrivadaArquivoRepository,
    private readonly storage: IStorageService,
  ) {}

  async execute(
    param: ObterArquivoDownloadUrlParam,
  ): AsyncResult<AppException, ArquivoDownloadUrl> {
    try {
      const found = await this.arquivos.findById(param.id);
      if (found.isLeft()) return left(found.value);
      if (!found.value)
        return left(
          new ObraPrivadaServiceException({
            code: ErrorCodeConstants.OBRA_PRIVADA_ARQUIVO_NOT_FOUND,
            statusCode: 404,
          }),
        );
      const value = found.value.toObject();
      const url = await this.storage.getDownloadUrl(
        value.storageKey,
        value.nomeOriginal,
      );
      if (url.isLeft()) return left(url.value);
      return right({ url: url.value, nome: value.nome, mimeType: value.mimeType });
    } catch (error) {
      if (error instanceof AppException) return left(error);
      return left(
        new ObraPrivadaServiceException({
          code: ErrorCodeConstants.OBRA_PRIVADA_ARQUIVO_INVALID_INPUT,
          statusCode: 400,
          cause: error,
        }),
      );
    }
  }
}
