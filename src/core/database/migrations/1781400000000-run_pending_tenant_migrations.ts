import { MigrationInterface, QueryRunner } from 'typeorm';
import TenantMigrationRunner from '@/core/multitenancy/tenant_migrations/tenant_migration_runner';

export default class RunPendingTenantMigrations1781400000000
  implements MigrationInterface
{
  name = 'RunPendingTenantMigrations1781400000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const tenants = (await queryRunner.query(
      `SELECT schema_name FROM "public"."tenancies" WHERE schema_name ~ '^tenant_[0-9a-f]{32}$'`,
    )) as { schema_name: string }[];

    for (const { schema_name: schemaName } of tenants) {
      await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
      await TenantMigrationRunner.runPending(queryRunner, schemaName);
    }
  }

  async down(): Promise<void> {
    // Tenant migrations are append-only and are not reverted individually.
  }
}
