interface SqlExecutor {
  query(query: string): Promise<unknown>;
}

export default abstract class TenantFinancialSchema {
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
      CREATE TABLE${ifNotExists} "${schemaName}"."empenho" (
        "id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "obra_id" uuid NOT NULL,
        "fonte_id" uuid NOT NULL,
        "tipo" character varying NOT NULL,
        "numero" character varying NOT NULL,
        "data_empenho" date NOT NULL,
        "valor" numeric(15,2) NOT NULL CHECK ("valor" > 0),
        "observacoes" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_empenho" PRIMARY KEY ("id")
      )
    `);
    await executor.query(`
      CREATE TABLE${ifNotExists} "${schemaName}"."liquidacao" (
        "id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "empenho_id" uuid NOT NULL,
        "fonte_id" uuid NOT NULL,
        "numero" character varying NOT NULL,
        "data_liquidacao" date NOT NULL,
        "valor" numeric(15,2) NOT NULL CHECK ("valor" > 0),
        "observacoes" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_liquidacao" PRIMARY KEY ("id")
      )
    `);
    await executor.query(`
      CREATE TABLE${ifNotExists} "${schemaName}"."pagamento" (
        "id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "empenho_id" uuid NOT NULL,
        "liquidacao_id" uuid NOT NULL,
        "fonte_id" uuid NOT NULL,
        "numero_ordem_bancaria" character varying NOT NULL,
        "data_ordem_bancaria" date NOT NULL,
        "valor" numeric(15,2) NOT NULL CHECK ("valor" > 0),
        "observacoes" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_pagamento" PRIMARY KEY ("id")
      )
    `);
    await executor.query(
      `CREATE INDEX${ifNotExists} "IDX_empenho_obra" ON "${schemaName}"."empenho" ("obra_id")`,
    );
    await executor.query(
      `CREATE INDEX${ifNotExists} "IDX_liquidacao_empenho" ON "${schemaName}"."liquidacao" ("empenho_id")`,
    );
    await executor.query(
      `CREATE INDEX${ifNotExists} "IDX_pagamento_empenho" ON "${schemaName}"."pagamento" ("empenho_id")`,
    );
    await executor.query(
      `CREATE INDEX${ifNotExists} "IDX_pagamento_liquidacao" ON "${schemaName}"."pagamento" ("liquidacao_id")`,
    );

    await this.addConstraintIfMissing(
      executor,
      schemaName,
      'empenho',
      'FK_empenho_obras',
      `ALTER TABLE "${schemaName}"."empenho" ADD CONSTRAINT "FK_empenho_obras" FOREIGN KEY ("obra_id") REFERENCES "${schemaName}"."obras" ("id") ON DELETE CASCADE`,
    );
    await this.addConstraintIfMissing(
      executor,
      schemaName,
      'liquidacao',
      'FK_liquidacao_empenho',
      `ALTER TABLE "${schemaName}"."liquidacao" ADD CONSTRAINT "FK_liquidacao_empenho" FOREIGN KEY ("empenho_id") REFERENCES "${schemaName}"."empenho" ("id") ON DELETE CASCADE`,
    );
    await this.addConstraintIfMissing(
      executor,
      schemaName,
      'pagamento',
      'FK_pagamento_empenho',
      `ALTER TABLE "${schemaName}"."pagamento" ADD CONSTRAINT "FK_pagamento_empenho" FOREIGN KEY ("empenho_id") REFERENCES "${schemaName}"."empenho" ("id") ON DELETE CASCADE`,
    );
    await this.addConstraintIfMissing(
      executor,
      schemaName,
      'pagamento',
      'FK_pagamento_liquidacao',
      `ALTER TABLE "${schemaName}"."pagamento" ADD CONSTRAINT "FK_pagamento_liquidacao" FOREIGN KEY ("liquidacao_id") REFERENCES "${schemaName}"."liquidacao" ("id") ON DELETE CASCADE`,
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
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
          WHERE c.conname = '${constraintName}'
            AND t.relname = '${tableName}'
            AND n.nspname = '${schemaName}'
        ) THEN
          ${alterTableSql};
        END IF;
      END $$;
    `);
  }
}
