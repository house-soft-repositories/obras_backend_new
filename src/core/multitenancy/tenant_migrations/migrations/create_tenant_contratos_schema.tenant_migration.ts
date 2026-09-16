import TenantContratosSchema from '@/core/multitenancy/tenant_contratos_schema';
import type {
  SqlExecutor,
  TenantMigration,
} from '@/core/multitenancy/tenant_migrations/tenant_migration.interface';

export default class CreateTenantContratosSchemaTenantMigration implements TenantMigration {
  name = '1781720000000-create_tenant_contratos_schema';

  async up(executor: SqlExecutor, schemaName: string): Promise<void> {
    await TenantContratosSchema.createIfMissing(executor, schemaName);
  }
}
