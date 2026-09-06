interface SqlExecutor {
  query(query: string): Promise<unknown>;
}

export default abstract class TenantIdentitySchema {
  static async create(executor: SqlExecutor, schemaName: string): Promise<void> {
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
      CREATE TABLE${ifNotExists} "${schemaName}"."localidades" (
        "id" uuid NOT NULL,
        "nome" character varying NOT NULL,
        "uf" character varying(2) NOT NULL,
        "codigo_ibge" character varying,
        "tipo" character varying,
        "municipio" character varying,
        "observacoes" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_localidades" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_localidades_tipo" CHECK (
          "tipo" IS NULL OR "tipo" IN ('BAIRRO', 'DISTRITO', 'REGIAO', 'ZONA_RURAL')
        )
      )
    `);
    await executor.query(`
      CREATE TABLE${ifNotExists} "${schemaName}"."orgaos" (
        "id" uuid NOT NULL,
        "localidade_id" uuid NOT NULL,
        "nome" character varying NOT NULL,
        "sigla" character varying,
        "tipo" character varying,
        "responsavel" character varying,
        "email" character varying,
        "telefone" character varying,
        "ativo" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_orgaos" PRIMARY KEY ("id"),
        CONSTRAINT "FK_orgaos_localidades" FOREIGN KEY ("localidade_id")
          REFERENCES "${schemaName}"."localidades" ("id"),
        CONSTRAINT "CHK_orgaos_tipo" CHECK (
          "tipo" IS NULL OR "tipo" IN ('SECRETARIA', 'AUTARQUIA', 'FUNDACAO', 'EMPRESA_PUBLICA')
        )
      )
    `);
    await executor.query(`
      CREATE TABLE${ifNotExists} "${schemaName}"."setores" (
        "id" uuid NOT NULL,
        "orgao_id" uuid NOT NULL,
        "nome" character varying NOT NULL,
        "ativo" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_setores" PRIMARY KEY ("id"),
        CONSTRAINT "FK_setores_orgaos" FOREIGN KEY ("orgao_id")
          REFERENCES "${schemaName}"."orgaos" ("id")
      )
    `);
    await executor.query(
      `CREATE INDEX${ifNotExists} "IDX_localidades_nome" ON "${schemaName}"."localidades" ("nome")`,
    );
    await executor.query(
      `CREATE INDEX${ifNotExists} "IDX_orgaos_nome" ON "${schemaName}"."orgaos" ("nome")`,
    );
    await executor.query(
      `CREATE INDEX${ifNotExists} "IDX_setores_orgao_nome" ON "${schemaName}"."setores" ("orgao_id", "nome")`,
    );
  }
}
