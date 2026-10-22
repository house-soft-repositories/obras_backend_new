import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import { unit, type Unit } from '@/core/types/unit';
import IObraPrivadaRepository from '@/modules/obras-privadas/adapters/obra_privada_repository.interface';
import IExcluirObraUseCase, {
  ExcluirObraParam,
} from '@/modules/obras-privadas/domain/usecase/excluir_obra.usecase';
import ObraPrivadaServiceException from '@/modules/obras-privadas/exceptions/obra_privada_service.exception';

export default class ExcluirObraService implements IExcluirObraUseCase {
  constructor(private readonly obras: IObraPrivadaRepository) {}

  async execute(param: ExcluirObraParam): AsyncResult<AppException, Unit> {
    try {
      const found = await this.obras.findById(param.id);
      if (found.isLeft()) return left(found.value);
      if (!found.value || found.value.toObject().deletedAt)
        return left(
          new ObraPrivadaServiceException({
            code: ErrorCodeConstants.OBRA_PRIVADA_NOT_FOUND,
            statusCode: 404,
          }),
        );
      const deleted = await this.obras.softDelete(param.id);
      if (deleted.isLeft()) return left(deleted.value);
      return right(unit);
    } catch (error) {
      if (error instanceof AppException) return left(error);
      return left(
        new ObraPrivadaServiceException({
          code: ErrorCodeConstants.OBRA_PRIVADA_REPOSITORY_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }
}
