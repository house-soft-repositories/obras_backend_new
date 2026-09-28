import { MigrationInterface, QueryRunner } from 'typeorm';

export default class BackfillObraOrcamentoPrevisto1781710000000
  implements MigrationInterface
{
  name = 'BackfillObraOrcamentoPrevisto1781710000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const tenancies = (await queryRunner.query(
      'SELECT schema_name FROM public.tenancies',
    )) as { schema_name: string }[];

    for (const { schema_name: schema } of tenancies) {
      if (!/^tenant_[0-9a-f]{32}$/.test(schema)) continue;
      await queryRunner.query(`
        DO $$
        BEGIN
          IF to_regclass('${schema}.obra_orcamentos') IS NOT NULL
            AND to_regclass('${schema}.obra_orcamento_previsto') IS NOT NULL
          THEN
            INSERT INTO "${schema}"."obra_orcamento_previsto"
              (id, tenant_id, obra_id, fonte_id, valor)
            SELECT id, tenant_id, obra_id, fonte_id, valor::numeric(18,2)
            FROM "${schema}"."obra_orcamentos" old_orcamento
            WHERE NOT EXISTS (
              SELECT 1
              FROM "${schema}"."obra_orcamento_previsto" previsto
              WHERE previsto.id = old_orcamento.id
            );
          END IF;
        END $$;
      `);
    }
  }

  async down(): Promise<void> {}
}
