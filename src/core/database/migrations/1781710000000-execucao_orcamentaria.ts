import { MigrationInterface, QueryRunner } from 'typeorm';
import TenantFinancialSchema from '@/core/multitenancy/tenant_financial_schema';

export class ExecucaoOrcamentaria1781710000000 implements MigrationInterface {
  name = 'ExecucaoOrcamentaria1781710000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const tenancies = (await queryRunner.query(
      `SELECT schema_name FROM public.tenancies`,
    )) as { schema_name: string }[];

    for (const tenancy of tenancies) {
      if (!/^tenant_[0-9a-f]{32}$/.test(tenancy.schema_name)) continue;
      await TenantFinancialSchema.createIfMissing(
        queryRunner,
        tenancy.schema_name,
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const tenancies = (await queryRunner.query(
      `SELECT schema_name FROM public.tenancies`,
    )) as { schema_name: string }[];

    for (const tenancy of tenancies) {
      if (!/^tenant_[0-9a-f]{32}$/.test(tenancy.schema_name)) continue;
      const s = tenancy.schema_name;
      await queryRunner.query(`DROP INDEX IF EXISTS "${s}"."IDX_pagamento_liquidacao"`);
      await queryRunner.query(`DROP INDEX IF EXISTS "${s}"."IDX_pagamento_empenho"`);
      await queryRunner.query(`DROP INDEX IF EXISTS "${s}"."IDX_liquidacao_empenho"`);
      await queryRunner.query(`DROP INDEX IF EXISTS "${s}"."IDX_empenho_obra"`);
      await queryRunner.query(`DROP TABLE IF EXISTS "${s}"."pagamento"`);
      await queryRunner.query(`DROP TABLE IF EXISTS "${s}"."liquidacao"`);
      await queryRunner.query(`DROP TABLE IF EXISTS "${s}"."empenho"`);
    }
  }
}
