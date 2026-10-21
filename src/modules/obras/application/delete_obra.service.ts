import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import { unit, type Unit } from '@/core/types/unit';
import IObraRepository from '@/modules/obras/adapters/obra_repository.interface';
import IDeleteObraUseCase, {
  DeleteObraParam,
} from '@/modules/obras/domain/usecase/delete_obra.usecase';
import ObraRepositoryException from '@/modules/obras/exceptions/obra_repository.exception';
import ErrorCodeConstants from '@/core/constants/error_code.constants';

export default class DeleteObraService implements IDeleteObraUseCase {
  constructor(private readonly repo: IObraRepository) {}

  async execute(param: DeleteObraParam): AsyncResult<AppException, Unit> {
    try {
      const found = await this.repo.findById(param.id);
      if (found.isLeft()) return left(found.value);
      if (!found.value)
        return left(
          new ObraRepositoryException({
            code: ErrorCodeConstants.OBRA_NOT_FOUND,
            statusCode: 404,
          }),
        );
      const deleted = await this.repo.softDelete(param.id);
      if (deleted.isLeft()) return left(deleted.value);
      return right(unit);
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(
        new ObraRepositoryException({
          code: ErrorCodeConstants.OBRA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }
}