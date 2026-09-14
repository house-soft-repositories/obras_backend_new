import { MigrationInterface, QueryRunner } from 'typeorm';
export class Contratos1781230000000 implements MigrationInterface {
  name = 'Contratos1781230000000';
  async up(queryRunner: QueryRunner): Promise<void> {
    const tenancies = (await queryRunner.query(`SELECT schema_name FROM public.tenancies`)) as { schema_name: string }[];
    for (const t of tenancies) {
      if (!/^tenant_[0-9a-f]{32}$/.test(t.schema_name)) continue;
      const s = t.schema_name;
      await queryRunner.query(`CREATE TABLE IF NOT EXISTS "${s}"."empresa_contratada" ("id" uuid NOT NULL, "tenant_id" uuid NOT NULL, "razao_social" character varying NOT NULL, "nome_fantasia" character varying, "cnpj" character varying NOT NULL, "responsavel" character varying, "cargo_responsavel" character varying, "email" character varying, "cep" character varying, "logradouro" character varying, "numero" character varying, "complemento" character varying, "bairro" character varying, "cidade" character varying, "uf" character varying(2), "ativo" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_empresa_contratada" PRIMARY KEY ("id"))`);
      await queryRunner.query(`CREATE TABLE IF NOT EXISTS "${s}"."empresa_contratada_telefone" ("id" uuid NOT NULL, "tenant_id" uuid NOT NULL, "empresa_contratada_id" uuid NOT NULL, "numero" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_empresa_contratada_telefone" PRIMARY KEY ("id"))`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_empresa_tenant" ON "${s}"."empresa_contratada" ("tenant_id")`);
      await queryRunner.query(`CREATE TABLE IF NOT EXISTS "${s}"."contrato" ("id" uuid NOT NULL, "tenant_id" uuid NOT NULL, "obra_id" uuid NOT NULL, "empresa_contratada_id" uuid NOT NULL, "numero" character varying NOT NULL, "objeto" text, "data_assinatura" date, "fim_vigencia" date, "data_os" date NOT NULL, "tipo_prazo_execucao" character varying NOT NULL, "prazo_execucao_dias" integer, "prazo_execucao_data" date, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_contrato" PRIMARY KEY ("id"), CONSTRAINT "UQ_contrato_obra" UNIQUE ("obra_id"))`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_contrato_obra" ON "${s}"."contrato" ("obra_id")`);
      await queryRunner.query(`CREATE TABLE IF NOT EXISTS "${s}"."contrato_fonte" ("id" uuid NOT NULL, "tenant_id" uuid NOT NULL, "contrato_id" uuid NOT NULL, "fonte_id" uuid NOT NULL, "valor" numeric(18,2) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_contrato_fonte" PRIMARY KEY ("id"))`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_contrato_fonte_contrato" ON "${s}"."contrato_fonte" ("contrato_id")`);
      await queryRunner.query(`CREATE TABLE IF NOT EXISTS "${s}"."aditivo" ("id" uuid NOT NULL, "tenant_id" uuid NOT NULL, "contrato_id" uuid NOT NULL, "numero" character varying NOT NULL, "tipo" character varying NOT NULL, "data_assinatura" date, "tipo_prazo_execucao" character varying, "prazo_execucao_dias" integer, "prazo_execucao_data" date, "vigencia_aditivada" date, "observacoes" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_aditivo" PRIMARY KEY ("id"), CONSTRAINT "UQ_aditivo_numero" UNIQUE ("tenant_id", "contrato_id", "numero"))`);
      await queryRunner.query(`CREATE TABLE IF NOT EXISTS "${s}"."aditivo_fonte" ("id" uuid NOT NULL, "tenant_id" uuid NOT NULL, "aditivo_id" uuid NOT NULL, "fonte_id" uuid NOT NULL, "valor" numeric(18,2) NOT NULL, CONSTRAINT "PK_aditivo_fonte" PRIMARY KEY ("id"))`);
      await queryRunner.query(`CREATE TABLE IF NOT EXISTS "${s}"."paralisacao" ("id" uuid NOT NULL, "tenant_id" uuid NOT NULL, "contrato_id" uuid NOT NULL, "data_paralisacao" date NOT NULL, "motivo" text NOT NULL, "termo_paralisacao_arquivo_id" uuid NOT NULL, "data_reinicio" date, "termo_retomada_arquivo_id" uuid, "dias_parados" integer, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_paralisacao" PRIMARY KEY ("id"))`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_paralisacao_contrato" ON "${s}"."paralisacao" ("contrato_id")`);
    }
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    const tenancies = (await queryRunner.query(`SELECT schema_name FROM public.tenancies`)) as { schema_name: string }[];
    for (const t of tenancies) {
      if (!/^tenant_[0-9a-f]{32}$/.test(t.schema_name)) continue;
      const s = t.schema_name;
      await queryRunner.query(`DROP TABLE IF EXISTS "${s}"."paralisacao"`);
      await queryRunner.query(`DROP TABLE IF EXISTS "${s}"."aditivo_fonte"`);
      await queryRunner.query(`DROP TABLE IF EXISTS "${s}"."aditivo"`);
      await queryRunner.query(`DROP TABLE IF EXISTS "${s}"."contrato_fonte"`);
      await queryRunner.query(`DROP TABLE IF EXISTS "${s}"."contrato"`);
      await queryRunner.query(`DROP TABLE IF EXISTS "${s}"."empresa_contratada_telefone"`);
      await queryRunner.query(`DROP TABLE IF EXISTS "${s}"."empresa_contratada"`);
    }
  }
}
