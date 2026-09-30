import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProfissionaisTecnicos1781800000000
  implements MigrationInterface
{
  name = 'AddProfissionaisTecnicos1781800000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const tenancies = (await queryRunner.query(
      `SELECT schema_name FROM public.tenancies`,
    )) as { schema_name: string }[];

    for (const tenancy of tenancies) {
      const schemaName = tenancy.schema_name;
      if (!/^tenant_[0-9a-f]{32}$/.test(schemaName)) continue;
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${schemaName}"."profissionais_tecnicos" (
          "id" uuid NOT NULL,
          "pessoa_id" uuid NOT NULL,
          "conselho" character varying NOT NULL,
          "numero_registro" character varying NOT NULL,
          "uf_registro" character varying(2),
          "titulo" character varying,
          "ativo" boolean NOT NULL DEFAULT true,
          "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          CONSTRAINT "PK_profissionais_tecnicos" PRIMARY KEY ("id")
        )
      `);
      await queryRunner.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_profissionais_tecnicos_pessoa" ON "${schemaName}"."profissionais_tecnicos" ("pessoa_id")`,
      );
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "IDX_profissionais_tecnicos_registro" ON "${schemaName}"."profissionais_tecnicos" ("numero_registro")`,
      );
      await queryRunner.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'FK_profissionais_tecnicos_pessoas'
              AND connamespace = '"${schemaName}"'::regnamespace
          ) THEN
            ALTER TABLE "${schemaName}"."profissionais_tecnicos"
              ADD CONSTRAINT "FK_profissionais_tecnicos_pessoas"
              FOREIGN KEY ("pessoa_id")
              REFERENCES "${schemaName}"."pessoas"("id")
              ON DELETE RESTRICT;
          END IF;
        END $$;
      `);
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const tenancies = (await queryRunner.query(
      `SELECT schema_name FROM public.tenancies`,
    )) as { schema_name: string }[];

    for (const tenancy of tenancies) {
      if (!/^tenant_[0-9a-f]{32}$/.test(tenancy.schema_name)) continue;
      await queryRunner.query(
        `DROP TABLE IF EXISTS "${tenancy.schema_name}"."profissionais_tecnicos"`,
      );
    }
  }
}
