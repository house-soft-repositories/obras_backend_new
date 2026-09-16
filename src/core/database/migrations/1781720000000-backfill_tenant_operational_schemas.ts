import { MigrationInterface, QueryRunner } from 'typeorm';
import TenantMigrationRunner from '@/core/multitenancy/tenant_migrations/tenant_migration_runner';

export default class BackfillTenantOperationalSchemas1781720000000 implements MigrationInterface {
  name = 'BackfillTenantOperationalSchemas1781720000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const tenancies = (await queryRunner.query(
      'SELECT schema_name FROM public.tenancies',
    )) as { schema_name: string }[];

    for (const { schema_name: schemaName } of tenancies) {
      if (!/^tenant_[0-9a-f]{32}$/.test(schemaName)) continue;
      await TenantMigrationRunner.runPending(queryRunner, schemaName);
    }
  }

  async down(): Promise<void> {}
}
