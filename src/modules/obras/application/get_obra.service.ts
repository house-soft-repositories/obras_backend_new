import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IObraRepository from '@/modules/obras/adapters/obra_repository.interface';
import IGetObraUseCase, { GetObraParam } from '@/modules/obras/domain/usecase/get_obra.usecase';
import ObraEntity from '@/modules/obras/domain/entities/obra.entity';
import ObraRepositoryException from '@/modules/obras/exceptions/obra_repository.exception';

export default class GetObraService implements IGetObraUseCase {
  constructor(
    private readonly repo: IObraRepository,
    private readonly tc: TenantContext,
  ) {}

  async execute(param: GetObraParam): AsyncResult<AppException, ObraEntity> {
    try {
      this.tc.require();
      const result = await this.repo.findOneWithRelations(param.id);
      if (result.isLeft()) return left(result.value);
      if (!result.value)
        return left(
          new ObraRepositoryException({
            code: ErrorCodeConstants.OBRA_NOT_FOUND,
            statusCode: 404,
          }),
        );
      return right(result.value);
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
