import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IFonteRepository from '@/modules/fontes/adapters/fonte_repository.interface';
import IDeleteFonteUseCase, { DeleteFonteParam } from '@/modules/fontes/domain/usecase/delete_fonte.usecase';
import FonteServiceException from '@/modules/fontes/exceptions/fonte_service.exception';

export default class DeleteFonteService implements IDeleteFonteUseCase {
  constructor(private readonly repo: IFonteRepository) {}

  async execute(param: DeleteFonteParam): AsyncResult<AppException, void> {
    try {
      const current = await this.repo.findById(param.id);
      if (current.isLeft()) return left(current.value);
      if (!current.value)
        return left(new FonteServiceException({ code: ErrorCodeConstants.FONTE_NOT_FOUND, statusCode: 404 }));
      const removed = await this.repo.delete(param.id);
      if (removed.isLeft()) return left(removed.value);
      return right(undefined);
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(new FonteServiceException({ code: ErrorCodeConstants.FONTE_DELETE_FAILED, statusCode: 500, cause }));
    }
  }
}
