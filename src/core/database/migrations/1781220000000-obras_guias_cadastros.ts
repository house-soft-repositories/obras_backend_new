import { MigrationInterface, QueryRunner } from 'typeorm';
import TenantIdentitySchema from '@/core/multitenancy/tenant_identity_schema';

export class ObrasGuiasCadastros1781220000000 implements MigrationInterface {
  name = 'ObrasGuiasCadastros1781220000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const tenancies = (await queryRunner.query(
      `SELECT schema_name FROM public.tenancies`,
    )) as { schema_name: string }[];

    for (const tenancy of tenancies) {
      if (!/^tenant_[0-9a-f]{32}$/.test(tenancy.schema_name)) continue;
      await TenantIdentitySchema.createGuiasCadastrosTables(
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
      await queryRunner.query(`DROP TABLE IF EXISTS "${s}"."recebimento"`);
      await queryRunner.query(`DROP TABLE IF EXISTS "${s}"."licenca"`);
      await queryRunner.query(`DROP TABLE IF EXISTS "${s}"."titularidade"`);
      await queryRunner.query(
        `DROP TABLE IF EXISTS "${s}"."obra_orcamento_previsto"`,
      );
      await queryRunner.query(`DROP TABLE IF EXISTS "${s}"."obra_localizacao"`);
      await queryRunner.query(`DROP TABLE IF EXISTS "${s}"."subtipologia"`);
      await queryRunner.query(`DROP TABLE IF EXISTS "${s}"."tipologia"`);
      await queryRunner.query(`DROP TABLE IF EXISTS "${s}"."subclassificacao"`);
      await queryRunner.query(`DROP TABLE IF EXISTS "${s}"."classificacao"`);
      await queryRunner.query(`DROP TABLE IF EXISTS "${s}"."eixo"`);
    }
  }
}
