import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import { unit, type Unit } from '@/core/types/unit';
import IObraPrivadaArquivoRepository from '@/modules/obras-privadas/adapters/obra_privada_arquivo_repository.interface';
import IExcluirArquivoUseCase, {
  ExcluirArquivoParam,
} from '@/modules/obras-privadas/domain/usecase/excluir_arquivo.usecase';
import ObraPrivadaServiceException from '@/modules/obras-privadas/exceptions/obra_privada_service.exception';
import IStorageService from '@/modules/storage/adapters/storage_service.interface';

export default class ExcluirArquivoService implements IExcluirArquivoUseCase {
  constructor(
    private readonly arquivos: IObraPrivadaArquivoRepository,
    private readonly storage: IStorageService,
  ) {}

  async execute(
    param: ExcluirArquivoParam,
  ): AsyncResult<AppException, Unit> {
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
      const storageKey = found.value.storageKey;
      const deleted = await this.arquivos.delete(param.id);
      if (deleted.isLeft()) return left(deleted.value);
      try {
        await this.storage.removeObject(storageKey);
      } catch {
        // objeto orfao no bucket; o metadado ja foi removido
      }
      return right(unit);
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
