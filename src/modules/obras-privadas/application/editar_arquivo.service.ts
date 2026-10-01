import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import IObraPrivadaArquivoRepository from '@/modules/obras-privadas/adapters/obra_privada_arquivo_repository.interface';
import ObraPrivadaArquivoEntity from '@/modules/obras-privadas/domain/entities/obra_privada_arquivo.entity';
import IEditarArquivoUseCase, {
  EditarArquivoParam,
} from '@/modules/obras-privadas/domain/usecase/editar_arquivo.usecase';
import ObraPrivadaServiceException from '@/modules/obras-privadas/exceptions/obra_privada_service.exception';

export default class EditarArquivoService implements IEditarArquivoUseCase {
  constructor(private readonly arquivos: IObraPrivadaArquivoRepository) {}

  async execute(
    param: EditarArquivoParam,
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
      const editado = found.value.editar({
        nome: param.nome,
        descricao: param.descricao,
        ordem: param.ordem,
        categoria: param.categoria,
      });
      return this.arquivos.save(editado);
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
