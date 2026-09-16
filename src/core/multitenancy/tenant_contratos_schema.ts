interface SqlExecutor {
  query(query: string): Promise<unknown>;
}

export default abstract class TenantContratosSchema {
  static async create(
    executor: SqlExecutor,
    schemaName: string,
  ): Promise<void> {
    await this.execute(executor, schemaName, '');
  }

  static async createIfMissing(
    executor: SqlExecutor,
    schemaName: string,
  ): Promise<void> {
    await this.execute(executor, schemaName, ' IF NOT EXISTS');
  }

  private static async execute(
    executor: SqlExecutor,
    schemaName: string,
    ifNotExists: string,
  ): Promise<void> {
    if (!/^tenant_[0-9a-f]{32}$/.test(schemaName)) {
      throw new Error('Invalid tenant schema name');
    }

    await executor.query(`
      CREATE TABLE${ifNotExists} "${schemaName}"."empresa_contratada" (
        "id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "razao_social" character varying NOT NULL,
        "nome_fantasia" character varying,
        "cnpj" character varying NOT NULL,
        "responsavel" character varying,
        "cargo_responsavel" character varying,
        "email" character varying,
        "cep" character varying,
        "logradouro" character varying,
        "numero" character varying,
        "complemento" character varying,
        "bairro" character varying,
        "cidade" character varying,
        "uf" character varying(2),
        "ativo" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_empresa_contratada" PRIMARY KEY ("id")
      )
    `);
    await executor.query(`
      CREATE TABLE${ifNotExists} "${schemaName}"."empresa_contratada_telefone" (
        "id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "empresa_contratada_id" uuid NOT NULL,
        "numero" character varying NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_empresa_contratada_telefone" PRIMARY KEY ("id")
      )
    `);
    await executor.query(
      `CREATE INDEX${ifNotExists} "IDX_empresa_tenant" ON "${schemaName}"."empresa_contratada" ("tenant_id")`,
    );
    await executor.query(`
      CREATE TABLE${ifNotExists} "${schemaName}"."contrato" (
        "id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "obra_id" uuid NOT NULL,
        "empresa_contratada_id" uuid NOT NULL,
        "numero" character varying NOT NULL,
        "objeto" text,
        "data_assinatura" date,
        "fim_vigencia" date,
        "data_os" date NOT NULL,
        "tipo_prazo_execucao" character varying NOT NULL,
        "prazo_execucao_dias" integer,
        "prazo_execucao_data" date,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_contrato" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_contrato_obra" UNIQUE ("obra_id")
      )
    `);
    await executor.query(
      `CREATE INDEX${ifNotExists} "IDX_contrato_obra" ON "${schemaName}"."contrato" ("obra_id")`,
    );
    await executor.query(`
      CREATE TABLE${ifNotExists} "${schemaName}"."contrato_fonte" (
        "id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "contrato_id" uuid NOT NULL,
        "fonte_id" uuid NOT NULL,
        "valor" numeric(18,2) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_contrato_fonte" PRIMARY KEY ("id")
      )
    `);
    await executor.query(
      `CREATE INDEX${ifNotExists} "IDX_contrato_fonte_contrato" ON "${schemaName}"."contrato_fonte" ("contrato_id")`,
    );
    await executor.query(`
      CREATE TABLE${ifNotExists} "${schemaName}"."aditivo" (
        "id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "contrato_id" uuid NOT NULL,
        "numero" character varying NOT NULL,
        "tipo" character varying NOT NULL,
        "data_assinatura" date,
        "tipo_prazo_execucao" character varying,
        "prazo_execucao_dias" integer,
        "prazo_execucao_data" date,
        "vigencia_aditivada" date,
        "observacoes" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_aditivo" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_aditivo_numero" UNIQUE ("tenant_id", "contrato_id", "numero")
      )
    `);
    await executor.query(`
      CREATE TABLE${ifNotExists} "${schemaName}"."aditivo_fonte" (
        "id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "aditivo_id" uuid NOT NULL,
        "fonte_id" uuid NOT NULL,
        "valor" numeric(18,2) NOT NULL,
        CONSTRAINT "PK_aditivo_fonte" PRIMARY KEY ("id")
      )
    `);
    await executor.query(`
      CREATE TABLE${ifNotExists} "${schemaName}"."paralisacao" (
        "id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "contrato_id" uuid NOT NULL,
        "data_paralisacao" date NOT NULL,
        "motivo" text NOT NULL,
        "termo_paralisacao_arquivo_id" uuid NOT NULL,
        "data_reinicio" date,
        "termo_retomada_arquivo_id" uuid,
        "dias_parados" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_paralisacao" PRIMARY KEY ("id")
      )
    `);
    await executor.query(
      `CREATE INDEX${ifNotExists} "IDX_paralisacao_contrato" ON "${schemaName}"."paralisacao" ("contrato_id")`,
    );

    for (const tableName of [
      'empresa_contratada',
      'empresa_contratada_telefone',
      'contrato',
      'contrato_fonte',
      'aditivo',
      'aditivo_fonte',
      'paralisacao',
    ]) {
      await this.addConstraintIfMissing(
        executor,
        schemaName,
        tableName,
        `FK_${tableName}_tenant`,
        `ALTER TABLE "${schemaName}"."${tableName}" ADD CONSTRAINT "FK_${tableName}_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenancies" ("id") ON DELETE CASCADE`,
      );
    }

    await this.addConstraintIfMissing(
      executor,
      schemaName,
      'empresa_contratada_telefone',
      'FK_empresa_contratada_telefone_empresa',
      `ALTER TABLE "${schemaName}"."empresa_contratada_telefone" ADD CONSTRAINT "FK_empresa_contratada_telefone_empresa" FOREIGN KEY ("empresa_contratada_id") REFERENCES "${schemaName}"."empresa_contratada" ("id") ON DELETE CASCADE`,
    );
    await this.addConstraintIfMissing(
      executor,
      schemaName,
      'contrato',
      'FK_contrato_obras',
      `ALTER TABLE "${schemaName}"."contrato" ADD CONSTRAINT "FK_contrato_obras" FOREIGN KEY ("obra_id") REFERENCES "${schemaName}"."obras" ("id") ON DELETE CASCADE`,
    );
    await this.addConstraintIfMissing(
      executor,
      schemaName,
      'contrato',
      'FK_contrato_empresa_contratada',
      `ALTER TABLE "${schemaName}"."contrato" ADD CONSTRAINT "FK_contrato_empresa_contratada" FOREIGN KEY ("empresa_contratada_id") REFERENCES "${schemaName}"."empresa_contratada" ("id") ON DELETE CASCADE`,
    );
    await this.addConstraintIfMissing(
      executor,
      schemaName,
      'contrato_fonte',
      'FK_contrato_fonte_contrato',
      `ALTER TABLE "${schemaName}"."contrato_fonte" ADD CONSTRAINT "FK_contrato_fonte_contrato" FOREIGN KEY ("contrato_id") REFERENCES "${schemaName}"."contrato" ("id") ON DELETE CASCADE`,
    );
    await this.addConstraintIfMissing(
      executor,
      schemaName,
      'contrato_fonte',
      'FK_contrato_fonte_fontes',
      `ALTER TABLE "${schemaName}"."contrato_fonte" ADD CONSTRAINT "FK_contrato_fonte_fontes" FOREIGN KEY ("fonte_id") REFERENCES "${schemaName}"."fontes" ("id") ON DELETE CASCADE`,
    );
    await this.addConstraintIfMissing(
      executor,
      schemaName,
      'aditivo',
      'FK_aditivo_contrato',
      `ALTER TABLE "${schemaName}"."aditivo" ADD CONSTRAINT "FK_aditivo_contrato" FOREIGN KEY ("contrato_id") REFERENCES "${schemaName}"."contrato" ("id") ON DELETE CASCADE`,
    );
    await this.addConstraintIfMissing(
      executor,
      schemaName,
      'aditivo_fonte',
      'FK_aditivo_fonte_aditivo',
      `ALTER TABLE "${schemaName}"."aditivo_fonte" ADD CONSTRAINT "FK_aditivo_fonte_aditivo" FOREIGN KEY ("aditivo_id") REFERENCES "${schemaName}"."aditivo" ("id") ON DELETE CASCADE`,
    );
    await this.addConstraintIfMissing(
      executor,
      schemaName,
      'aditivo_fonte',
      'FK_aditivo_fonte_fontes',
      `ALTER TABLE "${schemaName}"."aditivo_fonte" ADD CONSTRAINT "FK_aditivo_fonte_fontes" FOREIGN KEY ("fonte_id") REFERENCES "${schemaName}"."fontes" ("id") ON DELETE CASCADE`,
    );
    await this.addConstraintIfMissing(
      executor,
      schemaName,
      'paralisacao',
      'FK_paralisacao_contrato',
      `ALTER TABLE "${schemaName}"."paralisacao" ADD CONSTRAINT "FK_paralisacao_contrato" FOREIGN KEY ("contrato_id") REFERENCES "${schemaName}"."contrato" ("id") ON DELETE CASCADE`,
    );
    await this.addConstraintIfMissing(
      executor,
      schemaName,
      'paralisacao',
      'FK_paralisacao_termo_paralisacao',
      `ALTER TABLE "${schemaName}"."paralisacao" ADD CONSTRAINT "FK_paralisacao_termo_paralisacao" FOREIGN KEY ("termo_paralisacao_arquivo_id") REFERENCES "${schemaName}"."attachments" ("id") ON DELETE CASCADE`,
    );
    await this.addConstraintIfMissing(
      executor,
      schemaName,
      'paralisacao',
      'FK_paralisacao_termo_retomada',
      `ALTER TABLE "${schemaName}"."paralisacao" ADD CONSTRAINT "FK_paralisacao_termo_retomada" FOREIGN KEY ("termo_retomada_arquivo_id") REFERENCES "${schemaName}"."attachments" ("id") ON DELETE CASCADE`,
    );
  }

  private static async addConstraintIfMissing(
    executor: SqlExecutor,
    schemaName: string,
    tableName: string,
    constraintName: string,
    alterTableSql: string,
  ): Promise<void> {
    await executor.query(`
      DO $$ BEGIN
        IF to_regclass('"${schemaName}"."${tableName}"') IS NOT NULL
          AND NOT EXISTS (
            SELECT 1
            FROM pg_constraint c
            JOIN pg_class t ON t.oid = c.conrelid
            JOIN pg_namespace n ON n.oid = t.relnamespace
            WHERE c.conname = '${constraintName}'
              AND t.relname = '${tableName}'
              AND n.nspname = '${schemaName}'
          )
        THEN
          ${alterTableSql};
        END IF;
      END $$;
    `);
  }
}
