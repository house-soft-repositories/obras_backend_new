import { MigrationInterface, QueryRunner } from 'typeorm';
import TenantIdentitySchema from '@/core/multitenancy/tenant_identity_schema';

export default class BackfillObrasGuiasCadastros1781610000000 implements MigrationInterface {
  name = 'BackfillObrasGuiasCadastros1781610000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const tenancies = (await queryRunner.query(
      'SELECT schema_name FROM public.tenancies',
    )) as { schema_name: string }[];
    for (const { schema_name: schema } of tenancies) {
      if (!/^tenant_[0-9a-f]{32}$/.test(schema)) continue;
      await TenantIdentitySchema.createGuiasCadastrosTables(
        queryRunner,
        schema,
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const tenancies = (await queryRunner.query(
      'SELECT schema_name FROM public.tenancies',
    )) as { schema_name: string }[];
    for (const { schema_name: schema } of tenancies) {
      if (!/^tenant_[0-9a-f]{32}$/.test(schema)) continue;
      await queryRunner.query(`DROP TABLE IF EXISTS "${schema}"."recebimento"`);
      await queryRunner.query(`DROP TABLE IF EXISTS "${schema}"."licenca"`);
      await queryRunner.query(
        `DROP TABLE IF EXISTS "${schema}"."titularidade"`,
      );
      await queryRunner.query(
        `DROP TABLE IF EXISTS "${schema}"."obra_orcamento_previsto"`,
      );
      await queryRunner.query(
        `DROP TABLE IF EXISTS "${schema}"."obra_localizacao"`,
      );
      await queryRunner.query(
        `DROP TABLE IF EXISTS "${schema}"."subtipologia"`,
      );
      await queryRunner.query(`DROP TABLE IF EXISTS "${schema}"."tipologia"`);
      await queryRunner.query(
        `DROP TABLE IF EXISTS "${schema}"."subclassificacao"`,
      );
      await queryRunner.query(
        `DROP TABLE IF EXISTS "${schema}"."classificacao"`,
      );
      await queryRunner.query(`DROP TABLE IF EXISTS "${schema}"."eixo"`);
    }
  }
}
