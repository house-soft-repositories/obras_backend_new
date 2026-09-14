import { MigrationInterface, QueryRunner } from 'typeorm';

export default class CronogramaMedicoes1781240000000 implements MigrationInterface {
  name = 'CronogramaMedicoes1781240000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const tenancies = (await queryRunner.query('SELECT schema_name FROM public.tenancies')) as { schema_name: string }[];
    for (const { schema_name: schema } of tenancies) {
      if (!/^tenant_[0-9a-f]{32}$/.test(schema)) continue;
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}"."estagio" (
          "id" uuid NOT NULL, "tenant_id" uuid NOT NULL, "obra_id" uuid NOT NULL,
          "nome" varchar(255) NOT NULL, "posicao" integer NOT NULL DEFAULT 0,
          "ativo" boolean NOT NULL DEFAULT true, "status" varchar(30) NOT NULL DEFAULT 'PENDENTE',
          "modo_duracao" varchar(40), "data_inicio" date, "data_fim" date,
          "percentual_direto" numeric(5,2), "responsavel_usuario_id" uuid,
          "criado_em" timestamptz NOT NULL DEFAULT now(), "atualizado_em" timestamptz NOT NULL DEFAULT now(),
          CONSTRAINT "PK_estagio" PRIMARY KEY ("id")
        )`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_estagio_obra_posicao" ON "${schema}"."estagio" ("obra_id", "posicao")`);
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}"."estagio_acompanhamento" (
          "id" uuid NOT NULL, "tenant_id" uuid NOT NULL, "obra_id" uuid NOT NULL, "estagio_id" uuid NOT NULL,
          "percentual" numeric(5,2) NOT NULL, "data" date NOT NULL, "observacao" text,
          "autor_usuario_id" uuid NOT NULL, "criado_em" timestamptz NOT NULL DEFAULT now(),
          CONSTRAINT "PK_estagio_acompanhamento" PRIMARY KEY ("id")
        )`);
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}"."estagio_comentario" (
          "id" uuid NOT NULL, "tenant_id" uuid NOT NULL, "obra_id" uuid NOT NULL, "estagio_id" uuid NOT NULL,
          "texto" text NOT NULL, "autor_usuario_id" uuid NOT NULL, "criado_em" timestamptz NOT NULL DEFAULT now(),
          CONSTRAINT "PK_estagio_comentario" PRIMARY KEY ("id")
        )`);
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}"."medicao" (
          "id" uuid NOT NULL, "tenant_id" uuid NOT NULL, "obra_id" uuid NOT NULL,
          "numero" integer NOT NULL, "tipo" varchar(30) NOT NULL, "data" date NOT NULL,
          "observacao" text, "criado_em" timestamptz NOT NULL DEFAULT now(),
          CONSTRAINT "PK_medicao" PRIMARY KEY ("id")
        )`);
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}"."medicao_fonte" (
          "id" uuid NOT NULL, "tenant_id" uuid NOT NULL, "medicao_id" uuid NOT NULL,
          "fonte_id" uuid NOT NULL, "valor" numeric(18,2) NOT NULL,
          CONSTRAINT "PK_medicao_fonte" PRIMARY KEY ("id")
        )`);
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const tenancies = (await queryRunner.query('SELECT schema_name FROM public.tenancies')) as { schema_name: string }[];
    for (const { schema_name: schema } of tenancies) {
      if (!/^tenant_[0-9a-f]{32}$/.test(schema)) continue;
      for (const table of ['medicao_fonte', 'medicao', 'estagio_comentario', 'estagio_acompanhamento', 'estagio'])
        await queryRunner.query(`DROP TABLE IF EXISTS "${schema}"."${table}"`);
    }
  }
}
