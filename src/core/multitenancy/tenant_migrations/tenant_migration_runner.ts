import tenantMigrations from '@/core/multitenancy/tenant_migrations/tenant_migrations.registry';
import type { SqlExecutor } from '@/core/multitenancy/tenant_migrations/tenant_migration.interface';

export default abstract class TenantMigrationRunner {
  static async runPending(
    executor: SqlExecutor,
    schemaName: string,
  ): Promise<void> {
    if (!/^tenant_[0-9a-f]{32}$/.test(schemaName)) {
      throw new Error('Invalid tenant schema name');
    }

    await executor.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."tenant_migrations" (
        "name" character varying NOT NULL,
        "executed_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tenant_migrations" PRIMARY KEY ("name")
      )
    `);

    const executedRows = (await executor.query(
      `SELECT name FROM "${schemaName}"."tenant_migrations"`,
    )) as { name: string }[];
    const executed = new Set(executedRows.map((row) => row.name));

    for (const migration of tenantMigrations) {
      if (executed.has(migration.name)) continue;
      await migration.up(executor, schemaName);
      await executor.query(
        `INSERT INTO "${schemaName}"."tenant_migrations" ("name") VALUES ($1) ON CONFLICT ("name") DO NOTHING`,
        [migration.name],
      );
    }
  }
}
