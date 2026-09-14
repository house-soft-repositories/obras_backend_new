import { MigrationInterface, QueryRunner } from 'typeorm';

export class ObrasGuiasCadastros1781220000000 implements MigrationInterface {
  name = 'ObrasGuiasCadastros1781220000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const tenancies = (await queryRunner.query(
      `SELECT schema_name FROM public.tenancies`,
    )) as { schema_name: string }[];

    for (const tenancy of tenancies) {
      if (!/^tenant_[0-9a-f]{32}$/.test(tenancy.schema_name)) continue;
      const s = tenancy.schema_name;

      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${s}"."eixo" (
          "id" uuid NOT NULL,
          "tenant_id" uuid NOT NULL,
          "nome" character varying NOT NULL,
          "ativo" boolean NOT NULL DEFAULT true,
          "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          CONSTRAINT "PK_eixo" PRIMARY KEY ("id")
        )
      `);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_eixo_tenant" ON "${s}"."eixo" ("tenant_id")`);

      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${s}"."classificacao" (
          "id" uuid NOT NULL,
          "tenant_id" uuid NOT NULL,
          "nome" character varying NOT NULL,
          "ativo" boolean NOT NULL DEFAULT true,
          "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          CONSTRAINT "PK_classificacao" PRIMARY KEY ("id")
        )
      `);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_classificacao_tenant" ON "${s}"."classificacao" ("tenant_id")`);

      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${s}"."subclassificacao" (
          "id" uuid NOT NULL,
          "tenant_id" uuid NOT NULL,
          "classificacao_id" uuid NOT NULL,
          "nome" character varying NOT NULL,
          "ativo" boolean NOT NULL DEFAULT true,
          "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          CONSTRAINT "PK_subclassificacao" PRIMARY KEY ("id")
        )
      `);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_subclassificacao_tenant" ON "${s}"."subclassificacao" ("tenant_id")`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_subclassificacao_parent" ON "${s}"."subclassificacao" ("classificacao_id")`);

      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${s}"."tipologia" (
          "id" uuid NOT NULL,
          "tenant_id" uuid NOT NULL,
          "nome" character varying NOT NULL,
          "ativo" boolean NOT NULL DEFAULT true,
          "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          CONSTRAINT "PK_tipologia" PRIMARY KEY ("id")
        )
      `);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_tipologia_tenant" ON "${s}"."tipologia" ("tenant_id")`);

      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${s}"."subtipologia" (
          "id" uuid NOT NULL,
          "tenant_id" uuid NOT NULL,
          "tipologia_id" uuid NOT NULL,
          "nome" character varying NOT NULL,
          "ativo" boolean NOT NULL DEFAULT true,
          "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          CONSTRAINT "PK_subtipologia" PRIMARY KEY ("id")
        )
      `);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_subtipologia_tenant" ON "${s}"."subtipologia" ("tenant_id")`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_subtipologia_parent" ON "${s}"."subtipologia" ("tipologia_id")`);

      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${s}"."obra_localizacao" (
          "id" uuid NOT NULL,
          "tenant_id" uuid NOT NULL,
          "obra_id" uuid NOT NULL,
          "localidade" character varying NOT NULL,
          "uf" character varying(2) NOT NULL,
          "latitude" numeric(10,7),
          "longitude" numeric(10,7),
          "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          CONSTRAINT "PK_obra_localizacao" PRIMARY KEY ("id")
        )
      `);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_obra_localizacao_obra" ON "${s}"."obra_localizacao" ("obra_id")`);

      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${s}"."obra_orcamento_previsto" (
          "id" uuid NOT NULL,
          "tenant_id" uuid NOT NULL,
          "obra_id" uuid NOT NULL,
          "fonte_id" uuid NOT NULL,
          "valor" numeric(18,2) NOT NULL,
          "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          CONSTRAINT "PK_obra_orcamento_previsto" PRIMARY KEY ("id")
        )
      `);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_obra_orcamento_obra" ON "${s}"."obra_orcamento_previsto" ("obra_id")`);

      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${s}"."titularidade" (
          "id" uuid NOT NULL,
          "tenant_id" uuid NOT NULL,
          "obra_id" uuid NOT NULL,
          "situacao" character varying NOT NULL,
          "tipo" character varying,
          "observacoes" text,
          "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          CONSTRAINT "PK_titularidade" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_titularidade_obra" UNIQUE ("obra_id")
        )
      `);

      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${s}"."licenca" (
          "id" uuid NOT NULL,
          "tenant_id" uuid NOT NULL,
          "obra_id" uuid NOT NULL,
          "situacao" character varying NOT NULL,
          "tipo" character varying,
          "numero" character varying,
          "validade" date,
          "observacoes" text,
          "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          CONSTRAINT "PK_licenca" PRIMARY KEY ("id")
        )
      `);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_licenca_obra" ON "${s}"."licenca" ("obra_id")`);

      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${s}"."recebimento" (
          "id" uuid NOT NULL,
          "tenant_id" uuid NOT NULL,
          "obra_id" uuid NOT NULL,
          "tipo" character varying NOT NULL,
          "data" date,
          "data_prevista" date,
          "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          CONSTRAINT "PK_recebimento" PRIMARY KEY ("id")
        )
      `);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_recebimento_obra" ON "${s}"."recebimento" ("obra_id")`);
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
      await queryRunner.query(`DROP TABLE IF EXISTS "${s}"."obra_orcamento_previsto"`);
      await queryRunner.query(`DROP TABLE IF EXISTS "${s}"."obra_localizacao"`);
      await queryRunner.query(`DROP TABLE IF EXISTS "${s}"."subtipologia"`);
      await queryRunner.query(`DROP TABLE IF EXISTS "${s}"."tipologia"`);
      await queryRunner.query(`DROP TABLE IF EXISTS "${s}"."subclassificacao"`);
      await queryRunner.query(`DROP TABLE IF EXISTS "${s}"."classificacao"`);
      await queryRunner.query(`DROP TABLE IF EXISTS "${s}"."eixo"`);
    }
  }
}
