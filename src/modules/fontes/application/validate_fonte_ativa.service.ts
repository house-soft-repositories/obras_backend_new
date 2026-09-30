import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IFonteRepository from '@/modules/fontes/adapters/fonte_repository.interface';
import FonteEntity from '@/modules/fontes/domain/entities/fonte.entity';
import IValidateFonteAtivaUseCase, { ValidateFonteAtivaParam } from '@/modules/fontes/domain/usecase/validate_fonte_ativa.usecase';
import FonteServiceException from '@/modules/fontes/exceptions/fonte_service.exception';

export default class ValidateFonteAtivaService implements IValidateFonteAtivaUseCase {
  constructor(private readonly repo: IFonteRepository) {}

  async execute(param: ValidateFonteAtivaParam): AsyncResult<AppException, FonteEntity> {
    try {
      const found = await this.repo.findById(param.id);
      if (found.isLeft()) return left(found.value);
      if (!found.value)
        return left(new FonteServiceException({ code: ErrorCodeConstants.FONTE_NOT_FOUND, statusCode: 422 }));
      if (!found.value.ativo)
        return left(new FonteServiceException({ code: ErrorCodeConstants.FONTE_INATIVA, statusCode: 422 }));
      return right(found.value);
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(new FonteServiceException({ code: ErrorCodeConstants.FONTE_GET_FAILED, statusCode: 500, cause }));
    }
  }
}
