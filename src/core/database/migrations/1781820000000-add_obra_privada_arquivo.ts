import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddObraPrivadaArquivo1781820000000 implements MigrationInterface {
  name = 'AddObraPrivadaArquivo1781820000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const tenancies = (await queryRunner.query(
      `SELECT schema_name FROM public.tenancies`,
    )) as { schema_name: string }[];

    for (const tenancy of tenancies) {
      const schemaName = tenancy.schema_name;
      if (!/^tenant_[0-9a-f]{32}$/.test(schemaName)) continue;
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${schemaName}"."obra_privada_arquivo" (
          "id" uuid NOT NULL,
          "tenant_id" uuid NOT NULL,
          "obra_privada_id" uuid NOT NULL,
          "vinculo" character varying NOT NULL,
          "vinculo_id" uuid,
          "categoria" character varying NOT NULL DEFAULT 'DOCUMENTO',
          "nome" character varying NOT NULL,
          "descricao" text,
          "nome_original" character varying NOT NULL,
          "mime_type" character varying,
          "tamanho_bytes" bigint,
          "storage_key" character varying NOT NULL,
          "ordem" integer NOT NULL DEFAULT 0,
          "latitude" numeric(10,7),
          "longitude" numeric(10,7),
          "capturado_em" TIMESTAMP WITH TIME ZONE,
          "enviado_por_usuario_id" uuid NOT NULL,
          "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          CONSTRAINT "PK_obra_privada_arquivo" PRIMARY KEY ("id")
        )
      `);
      await queryRunner.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_obra_privada_arquivo_storage_key" ON "${schemaName}"."obra_privada_arquivo" ("storage_key")`,
      );
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "IDX_obra_privada_arquivo_vinculo" ON "${schemaName}"."obra_privada_arquivo" ("tenant_id", "obra_privada_id", "vinculo", "vinculo_id")`,
      );
      await queryRunner.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'FK_obra_privada_arquivo_obras_privadas'
              AND connamespace = '"${schemaName}"'::regnamespace
          ) THEN
            ALTER TABLE "${schemaName}"."obra_privada_arquivo"
              ADD CONSTRAINT "FK_obra_privada_arquivo_obras_privadas"
              FOREIGN KEY ("obra_privada_id")
              REFERENCES "${schemaName}"."obras_privadas"("id")
              ON DELETE CASCADE;
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
        `DROP TABLE IF EXISTS "${tenancy.schema_name}"."obra_privada_arquivo"`,
      );
    }
  }
}
