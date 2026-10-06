import { MigrationInterface, QueryRunner } from 'typeorm';

export default class AddMedicaoOrgaoId1781830000000 implements MigrationInterface {
  name = 'AddMedicaoOrgaoId1781830000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const tenancies = (await queryRunner.query(
      'SELECT schema_name FROM public.tenancies',
    )) as { schema_name: string }[];

    for (const { schema_name: schema } of tenancies) {
      if (!/^tenant_[0-9a-f]{32}$/.test(schema)) continue;
      await queryRunner.query(
        `ALTER TABLE "${schema}"."medicao" ADD COLUMN IF NOT EXISTS "orgao_id" uuid`,
      );
      await queryRunner.query(`
        DO $$ BEGIN
          IF to_regclass('"${schema}"."medicao"') IS NOT NULL
            AND to_regclass('"${schema}"."orgaos"') IS NOT NULL
            AND NOT EXISTS (
              SELECT 1
              FROM pg_constraint c
              JOIN pg_class t ON t.oid = c.conrelid
              JOIN pg_namespace n ON n.oid = t.relnamespace
              WHERE c.conname = 'FK_medicao_orgaos'
                AND t.relname = 'medicao'
                AND n.nspname = '${schema}'
            )
          THEN
            ALTER TABLE "${schema}"."medicao"
              ADD CONSTRAINT "FK_medicao_orgaos"
              FOREIGN KEY ("orgao_id") REFERENCES "${schema}"."orgaos" ("id")
              ON DELETE SET NULL;
          END IF;
        END $$;
      `);
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const tenancies = (await queryRunner.query(
      'SELECT schema_name FROM public.tenancies',
    )) as { schema_name: string }[];

    for (const { schema_name: schema } of tenancies) {
      if (!/^tenant_[0-9a-f]{32}$/.test(schema)) continue;
      await queryRunner.query(`
        DO $$ BEGIN
          IF to_regclass('"${schema}"."medicao"') IS NOT NULL THEN
            ALTER TABLE "${schema}"."medicao" DROP CONSTRAINT IF EXISTS "FK_medicao_orgaos";
            ALTER TABLE "${schema}"."medicao" DROP COLUMN IF EXISTS "orgao_id";
          END IF;
        END $$;
      `);
    }
  }
}
