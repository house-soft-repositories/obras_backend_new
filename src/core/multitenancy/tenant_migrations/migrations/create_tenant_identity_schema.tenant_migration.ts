import TenantIdentitySchema from '@/core/multitenancy/tenant_identity_schema';
import type {
  SqlExecutor,
  TenantMigration,
} from '@/core/multitenancy/tenant_migrations/tenant_migration.interface';

export default class CreateTenantIdentitySchemaTenantMigration implements TenantMigration {
  name = '1781300000000-create_tenant_identity_schema';

  async up(executor: SqlExecutor, schemaName: string): Promise<void> {
    await TenantIdentitySchema.createIfMissing(executor, schemaName);
  }
}
