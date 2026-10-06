import { DataSource, EntityManager } from 'typeorm';
import TenantContext from '@/core/multitenancy/tenant_context';

/**
 * Executa o callback com um EntityManager transacional já posicionado no
 * schema do tenant (SET LOCAL search_path).
 *
 * Todos os acessos a banco dentro do callback DEVEM usar
 * `manager.getRepository(Model)` — nunca `dataSource.query` (raw SQL) e
 * nunca um repository global fora da transação.
 */
export async function withTenantManager<T>(
  dataSource: DataSource,
  tenantContext: TenantContext,
  callback: (manager: EntityManager) => Promise<T>,
): Promise<T> {
  const queryRunner = dataSource.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const { schemaName } = tenantContext.require();
    const quoted = `"${schemaName.replace(/"/g, '""')}"`;
    await queryRunner.query(`SET LOCAL search_path TO ${quoted}, public`);

    const result = await callback(queryRunner.manager);
    await queryRunner.commitTransaction();

    return result;
  } catch (error) {
    if (queryRunner.isTransactionActive) await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
