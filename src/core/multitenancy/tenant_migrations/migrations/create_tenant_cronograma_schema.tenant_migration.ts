import TenantCronogramaSchema from '@/core/multitenancy/tenant_cronograma_schema';
import type {
  SqlExecutor,
  TenantMigration,
} from '@/core/multitenancy/tenant_migrations/tenant_migration.interface';

export default class CreateTenantCronogramaSchemaTenantMigration implements TenantMigration {
  name = '1781730000000-create_tenant_cronograma_schema';

  async up(executor: SqlExecutor, schemaName: string): Promise<void> {
    await TenantCronogramaSchema.createIfMissing(executor, schemaName);
  }
}
