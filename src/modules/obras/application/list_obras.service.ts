import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IObraRepository from '@/modules/obras/adapters/obra_repository.interface';
import IListObrasUseCase, { ListObrasParam } from '@/modules/obras/domain/usecase/list_obras.usecase';
import ObraServiceException from '@/modules/obras/exceptions/obra_service.exception';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import ObraEntity from '@/modules/obras/domain/entities/obra.entity';

export default class ListObrasService implements IListObrasUseCase {
  constructor(
    private readonly repo: IObraRepository,
    private readonly tc: TenantContext,
  ) {}

  async execute(param: ListObrasParam): AsyncResult<AppException, PageEntity<ObraEntity>> {
    try {
      this.tc.require();
      const result = await this.repo.findPage({
        status: param.status,
        tipo: param.tipo,
        orgaoId: param.orgaoId,
        q: param.q,
        pageOptions: param.pageOptions,
      });
      if (result.isLeft()) return left(result.value);
      return right(result.value);
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(
        new ObraServiceException({
          code: ErrorCodeConstants.OBRA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }
}
