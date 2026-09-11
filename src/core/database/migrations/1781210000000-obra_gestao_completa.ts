import { MigrationInterface, QueryRunner } from 'typeorm';

export class ObraGestaoCompleta1781210000000 implements MigrationInterface {
  name = 'ObraGestaoCompleta1781210000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const tenancies = (await queryRunner.query(
      `SELECT schema_name FROM public.tenancies`,
    )) as { schema_name: string }[];

    for (const tenancy of tenancies) {
      if (!/^tenant_[0-9a-f]{32}$/.test(tenancy.schema_name)) continue;
      const s = tenancy.schema_name;

      await queryRunner.query(
        `ALTER TABLE "${s}"."obras" ADD COLUMN IF NOT EXISTS "tipo_financiamento" character varying NOT NULL DEFAULT 'SEM_OGU'`,
      );
      await queryRunner.query(
        `ALTER TABLE "${s}"."obras" ADD COLUMN IF NOT EXISTS "modo_duracao" character varying NOT NULL DEFAULT 'DEFINIDO_PELO_USUARIO'`,
      );
      await queryRunner.query(`ALTER TABLE "${s}"."obras" ADD COLUMN IF NOT EXISTS "data_inicio" date`);
      await queryRunner.query(`ALTER TABLE "${s}"."obras" ADD COLUMN IF NOT EXISTS "data_prazo" date`);
      await queryRunner.query(
        `ALTER TABLE "${s}"."obras" ADD COLUMN IF NOT EXISTS "acao_conveniada" character varying NOT NULL DEFAULT 'NAO'`,
      );
      await queryRunner.query(
        `ALTER TABLE "${s}"."obras" ADD COLUMN IF NOT EXISTS "prioritaria" boolean NOT NULL DEFAULT false`,
      );
      await queryRunner.query(
        `ALTER TABLE "${s}"."obras" ADD COLUMN IF NOT EXISTS "exibir_camera_ao_vivo" boolean NOT NULL DEFAULT false`,
      );
      await queryRunner.query(`ALTER TABLE "${s}"."obras" ADD COLUMN IF NOT EXISTS "camera_url" character varying`);
      await queryRunner.query(
        `ALTER TABLE "${s}"."obras" ADD COLUMN IF NOT EXISTS "privado" boolean NOT NULL DEFAULT false`,
      );
      await queryRunner.query(
        `ALTER TABLE "${s}"."obras" ADD COLUMN IF NOT EXISTS "invisivel" boolean NOT NULL DEFAULT false`,
      );
      await queryRunner.query(
        `ALTER TABLE "${s}"."obras" ADD COLUMN IF NOT EXISTS "considerar_sabado" boolean NOT NULL DEFAULT false`,
      );
      await queryRunner.query(
        `ALTER TABLE "${s}"."obras" ADD COLUMN IF NOT EXISTS "considerar_domingo" boolean NOT NULL DEFAULT false`,
      );
      await queryRunner.query(
        `ALTER TABLE "${s}"."obras" ADD COLUMN IF NOT EXISTS "vincular_pagamento_percentual" boolean NOT NULL DEFAULT false`,
      );
      await queryRunner.query(
        `ALTER TABLE "${s}"."obras" ADD COLUMN IF NOT EXISTS "corresponsaveis_podem_editar" boolean NOT NULL DEFAULT false`,
      );
      await queryRunner.query(`ALTER TABLE "${s}"."obras" ADD COLUMN IF NOT EXISTS "programa_ppa" character varying`);
      await queryRunner.query(`ALTER TABLE "${s}"."obras" ADD COLUMN IF NOT EXISTS "acao_estrategica" character varying`);
      await queryRunner.query(`ALTER TABLE "${s}"."obras" ADD COLUMN IF NOT EXISTS "acao_orcamentaria" character varying`);
      await queryRunner.query(`ALTER TABLE "${s}"."obras" ADD COLUMN IF NOT EXISTS "unidade_medida" character varying`);
      await queryRunner.query(`ALTER TABLE "${s}"."obras" ADD COLUMN IF NOT EXISTS "quantidade" numeric(18,4)`);
      await queryRunner.query(`ALTER TABLE "${s}"."obras" ADD COLUMN IF NOT EXISTS "secretario" character varying`);
      await queryRunner.query(`ALTER TABLE "${s}"."obras" ADD COLUMN IF NOT EXISTS "data_pactuada" date`);

      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${s}"."tag" (
          "id" uuid NOT NULL,
          "tenant_id" uuid NOT NULL,
          "nome" character varying NOT NULL,
          "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          CONSTRAINT "PK_tag" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_tag_tenant_nome" UNIQUE ("tenant_id", "nome")
        )
      `);
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${s}"."obra_tag" (
          "id" uuid NOT NULL,
          "tenant_id" uuid NOT NULL,
          "obra_id" uuid NOT NULL,
          "tag_id" uuid NOT NULL,
          "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          CONSTRAINT "PK_obra_tag" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_obra_tag" UNIQUE ("obra_id", "tag_id")
        )
      `);
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${s}"."observacao" (
          "id" uuid NOT NULL,
          "tenant_id" uuid NOT NULL,
          "obra_id" uuid NOT NULL,
          "texto" text NOT NULL,
          "autor_usuario_id" uuid NOT NULL,
          "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          CONSTRAINT "PK_observacao" PRIMARY KEY ("id")
        )
      `);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_observacao_obra" ON "${s}"."observacao" ("obra_id")`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_obra_tag_obra" ON "${s}"."obra_tag" ("obra_id")`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_tag_tenant" ON "${s}"."tag" ("tenant_id")`);
      await queryRunner.query(`DROP INDEX IF EXISTS "${s}"."UQ_obras_codigo"`);
      await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_obras_codigo" ON "${s}"."obras" ("codigo") WHERE "deleted_at" IS NULL`);
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const tenancies = (await queryRunner.query(
      `SELECT schema_name FROM public.tenancies`,
    )) as { schema_name: string }[];

    for (const tenancy of tenancies) {
      if (!/^tenant_[0-9a-f]{32}$/.test(tenancy.schema_name)) continue;
      const s = tenancy.schema_name;
      await queryRunner.query(`DROP INDEX IF EXISTS "${s}"."UQ_obras_codigo"`);
      await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_obras_codigo" ON "${s}"."obras" ("codigo")`);
      await queryRunner.query(`DROP INDEX IF EXISTS "${s}"."IDX_tag_tenant"`);
      await queryRunner.query(`DROP INDEX IF EXISTS "${s}"."IDX_obra_tag_obra"`);
      await queryRunner.query(`DROP INDEX IF EXISTS "${s}"."IDX_observacao_obra"`);
      await queryRunner.query(`DROP TABLE IF EXISTS "${s}"."observacao"`);
      await queryRunner.query(`DROP TABLE IF EXISTS "${s}"."obra_tag"`);
      await queryRunner.query(`DROP TABLE IF EXISTS "${s}"."tag"`);
      await queryRunner.query(`ALTER TABLE "${s}"."obras" DROP COLUMN IF EXISTS "data_pactuada"`);
      await queryRunner.query(`ALTER TABLE "${s}"."obras" DROP COLUMN IF EXISTS "secretario"`);
      await queryRunner.query(`ALTER TABLE "${s}"."obras" DROP COLUMN IF EXISTS "quantidade"`);
      await queryRunner.query(`ALTER TABLE "${s}"."obras" DROP COLUMN IF EXISTS "unidade_medida"`);
      await queryRunner.query(`ALTER TABLE "${s}"."obras" DROP COLUMN IF EXISTS "acao_orcamentaria"`);
      await queryRunner.query(`ALTER TABLE "${s}"."obras" DROP COLUMN IF EXISTS "acao_estrategica"`);
      await queryRunner.query(`ALTER TABLE "${s}"."obras" DROP COLUMN IF EXISTS "programa_ppa"`);
      await queryRunner.query(`ALTER TABLE "${s}"."obras" DROP COLUMN IF EXISTS "corresponsaveis_podem_editar"`);
      await queryRunner.query(`ALTER TABLE "${s}"."obras" DROP COLUMN IF EXISTS "vincular_pagamento_percentual"`);
      await queryRunner.query(`ALTER TABLE "${s}"."obras" DROP COLUMN IF EXISTS "considerar_domingo"`);
      await queryRunner.query(`ALTER TABLE "${s}"."obras" DROP COLUMN IF EXISTS "considerar_sabado"`);
      await queryRunner.query(`ALTER TABLE "${s}"."obras" DROP COLUMN IF EXISTS "invisivel"`);
      await queryRunner.query(`ALTER TABLE "${s}"."obras" DROP COLUMN IF EXISTS "privado"`);
      await queryRunner.query(`ALTER TABLE "${s}"."obras" DROP COLUMN IF EXISTS "camera_url"`);
      await queryRunner.query(`ALTER TABLE "${s}"."obras" DROP COLUMN IF EXISTS "exibir_camera_ao_vivo"`);
      await queryRunner.query(`ALTER TABLE "${s}"."obras" DROP COLUMN IF EXISTS "prioritaria"`);
      await queryRunner.query(`ALTER TABLE "${s}"."obras" DROP COLUMN IF EXISTS "acao_conveniada"`);
      await queryRunner.query(`ALTER TABLE "${s}"."obras" DROP COLUMN IF EXISTS "data_prazo"`);
      await queryRunner.query(`ALTER TABLE "${s}"."obras" DROP COLUMN IF EXISTS "data_inicio"`);
      await queryRunner.query(`ALTER TABLE "${s}"."obras" DROP COLUMN IF EXISTS "modo_duracao"`);
      await queryRunner.query(`ALTER TABLE "${s}"."obras" DROP COLUMN IF EXISTS "tipo_financiamento"`);
    }
  }
}
