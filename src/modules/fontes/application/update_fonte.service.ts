import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import IFonteRepository from '@/modules/fontes/adapters/fonte_repository.interface';
import FonteEntity from '@/modules/fontes/domain/entities/fonte.entity';
import IUpdateFonteUseCase, { UpdateFonteParam } from '@/modules/fontes/domain/usecase/update_fonte.usecase';
import FonteDomainException from '@/modules/fontes/exceptions/fonte_domain.exception';
import FonteServiceException from '@/modules/fontes/exceptions/fonte_service.exception';

export default class UpdateFonteService implements IUpdateFonteUseCase {
  constructor(private readonly repo: IFonteRepository) {}

  async execute(param: UpdateFonteParam): AsyncResult<AppException, FonteEntity> {
    try {
      const current = await this.repo.findById(param.id);
      if (current.isLeft()) return left(current.value);
      if (!current.value)
        return left(new FonteServiceException({ code: ErrorCodeConstants.FONTE_NOT_FOUND, statusCode: 404 }));

      if (param.codigo !== undefined && param.codigo !== current.value.codigo && param.codigo) {
        const existing = await this.repo.findByCodigo(param.codigo);
        if (existing.isLeft()) return left(existing.value);
        if (existing.value && existing.value.id !== param.id)
          return left(new FonteServiceException({ code: ErrorCodeConstants.FONTE_DUPLICATE_CODE, statusCode: 409 }));
      }

      return this.repo.save(current.value.update(param));
    } catch (cause) {
      if (cause instanceof FonteDomainException) return left(cause);
      if (cause instanceof AppException) return left(cause);
      return left(new FonteServiceException({ code: ErrorCodeConstants.FONTE_UPDATE_FAILED, statusCode: 500, cause }));
    }
  }
}
