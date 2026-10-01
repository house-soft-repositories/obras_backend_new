import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAlvarasObrasPrivadas1781810000000 implements MigrationInterface {
  name = 'AddAlvarasObrasPrivadas1781810000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const tenancies = (await queryRunner.query(
      `SELECT schema_name FROM public.tenancies`,
    )) as { schema_name: string }[];

    for (const tenancy of tenancies) {
      const schemaName = tenancy.schema_name;
      if (!/^tenant_[0-9a-f]{32}$/.test(schemaName)) continue;
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${schemaName}"."alvara" (
          "id" uuid NOT NULL,
          "tenant_id" uuid NOT NULL,
          "obra_privada_id" uuid NOT NULL,
          "numero" character varying,
          "ano" integer NOT NULL,
          "tipo" character varying NOT NULL,
          "motivo" character varying NOT NULL DEFAULT 'ORIGINAL',
          "situacao" character varying NOT NULL DEFAULT 'VIGENTE',
          "data_emissao" date,
          "data_validade" date,
          "alvara_anterior_id" uuid,
          "area_terreno_m2" numeric(12,2),
          "area_construida_aprovada_m2" numeric(12,2),
          "uso" character varying,
          "pavimentos" integer,
          "unidades" integer,
          "processo_administrativo" character varying,
          "arquivo_id" uuid,
          "observacoes" text,
          "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          CONSTRAINT "PK_alvara" PRIMARY KEY ("id")
        )
      `);
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "IDX_alvara_obra" ON "${schemaName}"."alvara" ("obra_privada_id")`,
      );
      await queryRunner.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_alvara_numero_ano" ON "${schemaName}"."alvara" ("tenant_id", "ano", "numero") WHERE "numero" IS NOT NULL`,
      );
      await queryRunner.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'FK_alvara_obras_privadas'
              AND connamespace = '"${schemaName}"'::regnamespace
          ) THEN
            ALTER TABLE "${schemaName}"."alvara"
              ADD CONSTRAINT "FK_alvara_obras_privadas"
              FOREIGN KEY ("obra_privada_id")
              REFERENCES "${schemaName}"."obras_privadas"("id")
              ON DELETE CASCADE;
          END IF;
        END $$;
      `);
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${schemaName}"."obra_privada_responsavel" (
          "id" uuid NOT NULL,
          "tenant_id" uuid NOT NULL,
          "obra_privada_id" uuid NOT NULL,
          "profissional_tecnico_id" uuid NOT NULL,
          "papel" character varying NOT NULL,
          "tipo_documento" character varying NOT NULL,
          "numero_documento" character varying NOT NULL,
          "data_documento" date,
          "arquivo_id" uuid,
          "data_inicio" date,
          "data_baixa" date,
          "motivo_baixa" text,
          "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          CONSTRAINT "PK_obra_privada_responsavel" PRIMARY KEY ("id")
        )
      `);
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "IDX_obra_privada_responsavel_obra" ON "${schemaName}"."obra_privada_responsavel" ("tenant_id", "obra_privada_id")`,
      );
      await queryRunner.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'FK_obra_privada_responsavel_obras_privadas'
              AND connamespace = '"${schemaName}"'::regnamespace
          ) THEN
            ALTER TABLE "${schemaName}"."obra_privada_responsavel"
              ADD CONSTRAINT "FK_obra_privada_responsavel_obras_privadas"
              FOREIGN KEY ("obra_privada_id")
              REFERENCES "${schemaName}"."obras_privadas"("id")
              ON DELETE CASCADE;
          END IF;
        END $$;
      `);
      await queryRunner.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'FK_obra_privada_responsavel_profissionais'
              AND connamespace = '"${schemaName}"'::regnamespace
          ) THEN
            ALTER TABLE "${schemaName}"."obra_privada_responsavel"
              ADD CONSTRAINT "FK_obra_privada_responsavel_profissionais"
              FOREIGN KEY ("profissional_tecnico_id")
              REFERENCES "${schemaName}"."profissionais_tecnicos"("id")
              ON DELETE RESTRICT;
          END IF;
        END $$;
      `);
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${schemaName}"."habite_se" (
          "id" uuid NOT NULL,
          "tenant_id" uuid NOT NULL,
          "obra_privada_id" uuid NOT NULL,
          "numero" character varying NOT NULL,
          "data_emissao" date,
          "parcial" boolean NOT NULL DEFAULT false,
          "descricao_parcial" character varying,
          "data_vistoria" date,
          "vistoriador_usuario_id" uuid,
          "fiscalizacao_id" uuid,
          "resultado" character varying NOT NULL,
          "area_construida_executada_m2" numeric(12,2),
          "divergencia_projeto" boolean NOT NULL DEFAULT false,
          "divergencia_descricao" text,
          "parecer" text,
          "arquivo_id" uuid,
          "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          CONSTRAINT "PK_habite_se" PRIMARY KEY ("id")
        )
      `);
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "IDX_habite_se_obra" ON "${schemaName}"."habite_se" ("obra_privada_id")`,
      );
      await queryRunner.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'FK_habite_se_obras_privadas'
              AND connamespace = '"${schemaName}"'::regnamespace
          ) THEN
            ALTER TABLE "${schemaName}"."habite_se"
              ADD CONSTRAINT "FK_habite_se_obras_privadas"
              FOREIGN KEY ("obra_privada_id")
              REFERENCES "${schemaName}"."obras_privadas"("id")
              ON DELETE CASCADE;
          END IF;
        END $$;
      `);
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${schemaName}"."auto_infracao" (
          "id" uuid NOT NULL,
          "tenant_id" uuid NOT NULL,
          "obra_privada_id" uuid NOT NULL,
          "fiscalizacao_id" uuid,
          "numero" character varying NOT NULL,
          "tipo" character varying NOT NULL,
          "data_emissao" date NOT NULL,
          "prazo_dias" integer,
          "data_limite" date,
          "base_legal" text,
          "descricao" text NOT NULL,
          "valor_multa" numeric(15,2),
          "situacao" character varying NOT NULL DEFAULT 'ABERTO',
          "data_encerramento" date,
          "observacoes" text,
          "lavrado_por_usuario_id" uuid NOT NULL,
          "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          CONSTRAINT "PK_auto_infracao" PRIMARY KEY ("id")
        )
      `);
      await queryRunner.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_auto_infracao_numero" ON "${schemaName}"."auto_infracao" ("tenant_id", "numero")`,
      );
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "IDX_auto_infracao_obra" ON "${schemaName}"."auto_infracao" ("tenant_id", "obra_privada_id")`,
      );
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "IDX_auto_infracao_prazo" ON "${schemaName}"."auto_infracao" ("tenant_id", "situacao", "data_limite")`,
      );
      await queryRunner.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'FK_auto_infracao_obras_privadas'
              AND connamespace = '"${schemaName}"'::regnamespace
          ) THEN
            ALTER TABLE "${schemaName}"."auto_infracao"
              ADD CONSTRAINT "FK_auto_infracao_obras_privadas"
              FOREIGN KEY ("obra_privada_id")
              REFERENCES "${schemaName}"."obras_privadas"("id")
              ON DELETE CASCADE;
          END IF;
        END $$;
      `);
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${schemaName}"."obra_privada_observacao" (
          "id" uuid NOT NULL,
          "tenant_id" uuid NOT NULL,
          "obra_privada_id" uuid NOT NULL,
          "texto" text NOT NULL,
          "autor_usuario_id" uuid NOT NULL,
          "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          CONSTRAINT "PK_obra_privada_observacao" PRIMARY KEY ("id")
        )
      `);
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "IDX_obra_privada_observacao_obra" ON "${schemaName}"."obra_privada_observacao" ("tenant_id", "obra_privada_id")`,
      );
      await queryRunner.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'FK_obra_privada_observacao_obras_privadas'
              AND connamespace = '"${schemaName}"'::regnamespace
          ) THEN
            ALTER TABLE "${schemaName}"."obra_privada_observacao"
              ADD CONSTRAINT "FK_obra_privada_observacao_obras_privadas"
              FOREIGN KEY ("obra_privada_id")
              REFERENCES "${schemaName}"."obras_privadas"("id")
              ON DELETE CASCADE;
          END IF;
        END $$;
      `);
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${schemaName}"."fiscalizacao" (
          "id" uuid NOT NULL,
          "tenant_id" uuid NOT NULL,
          "obra_privada_id" uuid NOT NULL,
          "numero" character varying NOT NULL,
          "tipo" character varying NOT NULL,
          "data_fiscalizacao" date NOT NULL,
          "fiscal_usuario_id" uuid NOT NULL,
          "resultado" character varying NOT NULL,
          "etapa_constatada" character varying,
          "constatacoes" text,
          "providencias" text,
          "latitude" numeric(10,7),
          "longitude" numeric(10,7),
          "entulho_ha_irregularidade" boolean,
          "entulho_volume_estimado_m3" numeric(10,2),
          "entulho_local" character varying,
          "entulho_possui_cacamba" boolean,
          "entulho_possui_pgrcc" boolean,
          "entulho_destinacao" text,
          "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          CONSTRAINT "PK_fiscalizacao" PRIMARY KEY ("id")
        )
      `);
      await queryRunner.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_fiscalizacao_numero" ON "${schemaName}"."fiscalizacao" ("tenant_id", "numero")`,
      );
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "IDX_fiscalizacao_obra" ON "${schemaName}"."fiscalizacao" ("tenant_id", "obra_privada_id", "data_fiscalizacao")`,
      );
      await queryRunner.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'FK_fiscalizacao_obras_privadas'
              AND connamespace = '"${schemaName}"'::regnamespace
          ) THEN
            ALTER TABLE "${schemaName}"."fiscalizacao"
              ADD CONSTRAINT "FK_fiscalizacao_obras_privadas"
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
        `DROP TABLE IF EXISTS "${tenancy.schema_name}"."obra_privada_responsavel"`,
      );
      await queryRunner.query(
        `DROP TABLE IF EXISTS "${tenancy.schema_name}"."habite_se"`,
      );
      await queryRunner.query(
        `DROP TABLE IF EXISTS "${tenancy.schema_name}"."auto_infracao"`,
      );
      await queryRunner.query(
        `DROP TABLE IF EXISTS "${tenancy.schema_name}"."obra_privada_observacao"`,
      );
      await queryRunner.query(
        `DROP TABLE IF EXISTS "${tenancy.schema_name}"."fiscalizacao"`,
      );
      await queryRunner.query(
        `DROP TABLE IF EXISTS "${tenancy.schema_name}"."alvara"`,
      );
    }
  }
}
