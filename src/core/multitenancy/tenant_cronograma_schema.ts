interface SqlExecutor {
  query(query: string): Promise<unknown>;
}

export default abstract class TenantCronogramaSchema {
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
      CREATE TABLE${ifNotExists} "${schemaName}"."estagio" (
        "id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "obra_id" uuid NOT NULL,
        "nome" varchar(160) NOT NULL,
        "posicao" integer NOT NULL,
        "ativo" boolean NOT NULL DEFAULT true,
        "status" varchar(30) NOT NULL DEFAULT 'PENDENTE',
        "modo_duracao" varchar(40),
        "data_inicio" date,
        "data_fim" date,
        "percentual_direto" numeric(5,2),
        "responsavel_usuario_id" uuid,
        "criado_em" timestamptz NOT NULL DEFAULT now(),
        "atualizado_em" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_estagio" PRIMARY KEY ("id")
      )
    `);
    await executor.query(
      `CREATE INDEX${ifNotExists} "IDX_estagio_obra_posicao" ON "${schemaName}"."estagio" ("obra_id", "posicao")`,
    );
    await executor.query(`
      CREATE TABLE${ifNotExists} "${schemaName}"."estagio_acompanhamento" (
        "id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "obra_id" uuid NOT NULL,
        "estagio_id" uuid NOT NULL,
        "percentual" numeric(5,2) NOT NULL,
        "data" date NOT NULL,
        "observacao" text,
        "autor_usuario_id" uuid NOT NULL,
        "criado_em" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_estagio_acompanhamento" PRIMARY KEY ("id")
      )
    `);
    await executor.query(`
      CREATE TABLE${ifNotExists} "${schemaName}"."estagio_comentario" (
        "id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "obra_id" uuid NOT NULL,
        "estagio_id" uuid NOT NULL,
        "texto" text NOT NULL,
        "autor_usuario_id" uuid NOT NULL,
        "criado_em" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_estagio_comentario" PRIMARY KEY ("id")
      )
    `);
    await executor.query(`
      CREATE TABLE${ifNotExists} "${schemaName}"."medicao" (
        "id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "obra_id" uuid NOT NULL,
        "numero" integer NOT NULL,
        "tipo" varchar(30) NOT NULL,
        "data" date NOT NULL,
        "observacao" text,
        "criado_em" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_medicao" PRIMARY KEY ("id")
      )
    `);
    await executor.query(`
      CREATE TABLE${ifNotExists} "${schemaName}"."medicao_fonte" (
        "id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "medicao_id" uuid NOT NULL,
        "fonte_id" uuid NOT NULL,
        "valor" numeric(18,2) NOT NULL,
        CONSTRAINT "PK_medicao_fonte" PRIMARY KEY ("id")
      )
    `);

    for (const tableName of [
      'estagio',
      'estagio_acompanhamento',
      'estagio_comentario',
      'medicao',
      'medicao_fonte',
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
      'estagio',
      'FK_estagio_obras',
      `ALTER TABLE "${schemaName}"."estagio" ADD CONSTRAINT "FK_estagio_obras" FOREIGN KEY ("obra_id") REFERENCES "${schemaName}"."obras" ("id") ON DELETE CASCADE`,
    );
    await this.addConstraintIfMissing(
      executor,
      schemaName,
      'estagio',
      'FK_estagio_responsavel_user',
      `ALTER TABLE "${schemaName}"."estagio" ADD CONSTRAINT "FK_estagio_responsavel_user" FOREIGN KEY ("responsavel_usuario_id") REFERENCES "public"."users" ("id") ON DELETE CASCADE`,
    );
    await this.addConstraintIfMissing(
      executor,
      schemaName,
      'estagio_acompanhamento',
      'FK_estagio_acompanhamento_obras',
      `ALTER TABLE "${schemaName}"."estagio_acompanhamento" ADD CONSTRAINT "FK_estagio_acompanhamento_obras" FOREIGN KEY ("obra_id") REFERENCES "${schemaName}"."obras" ("id") ON DELETE CASCADE`,
    );
    await this.addConstraintIfMissing(
      executor,
      schemaName,
      'estagio_acompanhamento',
      'FK_estagio_acompanhamento_estagio',
      `ALTER TABLE "${schemaName}"."estagio_acompanhamento" ADD CONSTRAINT "FK_estagio_acompanhamento_estagio" FOREIGN KEY ("estagio_id") REFERENCES "${schemaName}"."estagio" ("id") ON DELETE CASCADE`,
    );
    await this.addConstraintIfMissing(
      executor,
      schemaName,
      'estagio_acompanhamento',
      'FK_estagio_acompanhamento_users',
      `ALTER TABLE "${schemaName}"."estagio_acompanhamento" ADD CONSTRAINT "FK_estagio_acompanhamento_users" FOREIGN KEY ("autor_usuario_id") REFERENCES "public"."users" ("id") ON DELETE CASCADE`,
    );
    await this.addConstraintIfMissing(
      executor,
      schemaName,
      'estagio_comentario',
      'FK_estagio_comentario_obras',
      `ALTER TABLE "${schemaName}"."estagio_comentario" ADD CONSTRAINT "FK_estagio_comentario_obras" FOREIGN KEY ("obra_id") REFERENCES "${schemaName}"."obras" ("id") ON DELETE CASCADE`,
    );
    await this.addConstraintIfMissing(
      executor,
      schemaName,
      'estagio_comentario',
      'FK_estagio_comentario_estagio',
      `ALTER TABLE "${schemaName}"."estagio_comentario" ADD CONSTRAINT "FK_estagio_comentario_estagio" FOREIGN KEY ("estagio_id") REFERENCES "${schemaName}"."estagio" ("id") ON DELETE CASCADE`,
    );
    await this.addConstraintIfMissing(
      executor,
      schemaName,
      'estagio_comentario',
      'FK_estagio_comentario_users',
      `ALTER TABLE "${schemaName}"."estagio_comentario" ADD CONSTRAINT "FK_estagio_comentario_users" FOREIGN KEY ("autor_usuario_id") REFERENCES "public"."users" ("id") ON DELETE CASCADE`,
    );
    await this.addConstraintIfMissing(
      executor,
      schemaName,
      'medicao',
      'FK_medicao_obras',
      `ALTER TABLE "${schemaName}"."medicao" ADD CONSTRAINT "FK_medicao_obras" FOREIGN KEY ("obra_id") REFERENCES "${schemaName}"."obras" ("id") ON DELETE CASCADE`,
    );
    await this.addConstraintIfMissing(
      executor,
      schemaName,
      'medicao_fonte',
      'FK_medicao_fonte_medicao',
      `ALTER TABLE "${schemaName}"."medicao_fonte" ADD CONSTRAINT "FK_medicao_fonte_medicao" FOREIGN KEY ("medicao_id") REFERENCES "${schemaName}"."medicao" ("id") ON DELETE CASCADE`,
    );
    await this.addConstraintIfMissing(
      executor,
      schemaName,
      'medicao_fonte',
      'FK_medicao_fonte_fontes',
      `ALTER TABLE "${schemaName}"."medicao_fonte" ADD CONSTRAINT "FK_medicao_fonte_fontes" FOREIGN KEY ("fonte_id") REFERENCES "${schemaName}"."fontes" ("id") ON DELETE CASCADE`,
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
