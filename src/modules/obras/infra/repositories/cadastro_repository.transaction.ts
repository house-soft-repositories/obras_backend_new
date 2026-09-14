import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
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
  const queryRunner = dataSource.createQueryRunner();
  try {
    const context = tenantContext.require();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    await queryRunner.query(`SET LOCAL search_path TO "${context.schemaName}", public`);
    const result = await callback(
      queryRunner.manager.getRepository(model),
      context.tenantId,
    );
    await queryRunner.commitTransaction();
    return right(result);
  } catch (cause) {
    if (queryRunner.isTransactionActive) await queryRunner.rollbackTransaction();
    return left(new CadastroRepositoryException({
      code: ErrorCodeConstants.CADASTRO_REPOSITORY_FAILED,
      statusCode: 500,
      cause,
    }));
  } finally {
    if (!queryRunner.isReleased) await queryRunner.release();
  }
}
