import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import { withManager } from '@/core/multitenancy/tenant_manager';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import CadastroRepositoryException from '@/modules/obras/exceptions/cadastro_repository.exception';
import { DataSource, EntityTarget, Repository } from 'typeorm';

export async function withCadastroTransaction<TModel extends object, TResult>(
  dataSource: DataSource,
  tenantContext: TenantContext,
  model: EntityTarget<TModel>,
  callback: (repository: Repository<TModel>, tenantId: string) => Promise<TResult>,
): AsyncResult<AppException, TResult> {
  try {
    const { tenantId } = tenantContext.require();
    const result = await withManager(
      dataSource,
      tenantContext,
      async (manager) => callback(manager.getRepository(model), tenantId),
    );
    return right(result);
  } catch (cause) {
    return left(new CadastroRepositoryException({
      code: ErrorCodeConstants.CADASTRO_REPOSITORY_FAILED,
      statusCode: 500,
      cause,
    }));
  }
}
