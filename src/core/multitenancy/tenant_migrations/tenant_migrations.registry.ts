import type { TenantMigration } from '@/core/multitenancy/tenant_migrations/tenant_migration.interface';
import CreateTenantIdentitySchemaTenantMigration from '@/core/multitenancy/tenant_migrations/migrations/create_tenant_identity_schema.tenant_migration';
import CreateTenantFinancialSchemaTenantMigration from '@/core/multitenancy/tenant_migrations/migrations/create_tenant_financial_schema.tenant_migration';
import CreateTenantContratosSchemaTenantMigration from '@/core/multitenancy/tenant_migrations/migrations/create_tenant_contratos_schema.tenant_migration';
import CreateTenantCronogramaSchemaTenantMigration from '@/core/multitenancy/tenant_migrations/migrations/create_tenant_cronograma_schema.tenant_migration';

const tenantMigrations: TenantMigration[] = [
  new CreateTenantIdentitySchemaTenantMigration(),
  new CreateTenantFinancialSchemaTenantMigration(),
  new CreateTenantContratosSchemaTenantMigration(),
  new CreateTenantCronogramaSchemaTenantMigration(),
];

export default tenantMigrations;
