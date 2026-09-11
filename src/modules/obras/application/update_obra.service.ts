import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IObraRepository from '@/modules/obras/adapters/obra_repository.interface';
import IUpdateObraUseCase, { UpdateObraParam } from '@/modules/obras/domain/usecase/update_obra.usecase';
import ObraEntity from '@/modules/obras/domain/entities/obra.entity';
import ObraDomainException from '@/modules/obras/exceptions/obra_domain.exception';
import ObraRepositoryException from '@/modules/obras/exceptions/obra_repository.exception';

export default class UpdateObraService implements IUpdateObraUseCase {
  constructor(
    private readonly repo: IObraRepository,
    private readonly tc: TenantContext,
  ) {}

  async execute(param: UpdateObraParam): AsyncResult<AppException, ObraEntity> {
    try {
      this.tc.require();
      if ('codigo' in param.data && (param.data as Record<string, unknown>)['codigo'] !== undefined) {
        return left(
          new ObraDomainException({ code: ErrorCodeConstants.OBRA_INVALID_TIPO }),
        );
      }
      const found = await this.repo.findById(param.id);
      if (found.isLeft()) return left(found.value);
      if (!found.value)
        return left(
          new ObraRepositoryException({
            code: ErrorCodeConstants.OBRA_NOT_FOUND,
            statusCode: 404,
          }),
        );
      const entity = found.value;
      try {
        entity.updatePartial(param.data);
      } catch (e) {
        if (e instanceof AppException) return left(e);
        throw e;
      }
      const saved = await this.repo.updatePartial(entity);
      if (saved.isLeft()) return left(saved.value);
      return right(saved.value);
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
