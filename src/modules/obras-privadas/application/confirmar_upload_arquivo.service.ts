import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import IObraPrivadaArquivoRepository from '@/modules/obras-privadas/adapters/obra_privada_arquivo_repository.interface';
import ObraPrivadaArquivoEntity from '@/modules/obras-privadas/domain/entities/obra_privada_arquivo.entity';
import IConfirmarUploadArquivoUseCase, {
  ConfirmarUploadArquivoParam,
} from '@/modules/obras-privadas/domain/usecase/confirmar_upload_arquivo.usecase';
import ObraPrivadaServiceException from '@/modules/obras-privadas/exceptions/obra_privada_service.exception';

export default class ConfirmarUploadArquivoService implements IConfirmarUploadArquivoUseCase {
  constructor(private readonly arquivos: IObraPrivadaArquivoRepository) {}

  async execute(
    param: ConfirmarUploadArquivoParam,
  ): AsyncResult<AppException, ObraPrivadaArquivoEntity> {
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
      const confirmado = found.value.confirmar(
        param.tamanhoBytes !== undefined ? String(param.tamanhoBytes) : '',
        param.mimeType ?? null,
      );
      return this.arquivos.save(confirmado);
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
