import TenantFinancialSchema from '@/core/multitenancy/tenant_financial_schema';
import type {
  SqlExecutor,
  TenantMigration,
} from '@/core/multitenancy/tenant_migrations/tenant_migration.interface';

export default class CreateTenantFinancialSchemaTenantMigration implements TenantMigration {
  name = '1781710000000-create_tenant_financial_schema';

  async up(executor: SqlExecutor, schemaName: string): Promise<void> {
    await TenantFinancialSchema.createIfMissing(executor, schemaName);
  }
}
