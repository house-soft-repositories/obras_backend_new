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
    await executor.query(`
      CREATE TABLE${ifNotExists} "${schemaName}"."fontes" (
        "id" uuid NOT NULL,
        "nome" character varying NOT NULL,
        "descricao" character varying,
        "codigo" character varying,
        "tipo" character varying,
        "valor_previsto" character varying,
        "vigencia" character varying,
        "ativo" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fontes" PRIMARY KEY ("id")
      )
    `);
    await executor.query(
      `CREATE UNIQUE INDEX${ifNotExists} "UQ_fontes_codigo" ON "${schemaName}"."fontes" ("codigo") WHERE "codigo" IS NOT NULL`,
    );
    await executor.query(`
      CREATE TABLE${ifNotExists} "${schemaName}"."pessoas" (
        "id" uuid NOT NULL,
        "tipo" character varying NOT NULL,
        "documento" character varying NOT NULL,
        "nome" character varying NOT NULL,
        "nome_fantasia" character varying,
        "rg" character varying,
        "orgao_expedidor" character varying,
        "email" character varying,
        "telefone" character varying,
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
        CONSTRAINT "PK_pessoas" PRIMARY KEY ("id")
      )
    `);
    await executor.query(
      `CREATE UNIQUE INDEX${ifNotExists} "UQ_pessoas_documento" ON "${schemaName}"."pessoas" ("documento")`,
    );
    await executor.query(`CREATE INDEX${ifNotExists} "IDX_pessoas_nome" ON "${schemaName}"."pessoas" ("nome")`);
    await executor.query(`
      CREATE TABLE${ifNotExists} "${schemaName}"."obras" (
        "id" uuid NOT NULL,
        "codigo" character varying NOT NULL,
        "nome" character varying NOT NULL,
        "descricao" character varying,
        "tipo" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'EM_ABERTO',
        "tipo_financiamento" character varying NOT NULL DEFAULT 'SEM_OGU',
        "modo_duracao" character varying NOT NULL DEFAULT 'DEFINIDO_PELO_USUARIO',
        "data_inicio" date,
        "data_prazo" date,
        "acao_conveniada" character varying NOT NULL DEFAULT 'NAO',
        "prioritaria" boolean NOT NULL DEFAULT false,
        "exibir_camera_ao_vivo" boolean NOT NULL DEFAULT false,
        "camera_url" character varying,
        "privado" boolean NOT NULL DEFAULT false,
        "invisivel" boolean NOT NULL DEFAULT false,
        "considerar_sabado" boolean NOT NULL DEFAULT false,
        "considerar_domingo" boolean NOT NULL DEFAULT false,
        "seguir_automatico" boolean NOT NULL DEFAULT false,
        "vincular_pagamento_percentual" boolean NOT NULL DEFAULT false,
        "corresponsaveis_podem_editar" boolean NOT NULL DEFAULT false,
        "orgao_id" uuid NOT NULL,
        "setor_id" uuid,
        "localidade_id" uuid,
        "subclassificacao_id" uuid,
        "eixo_id" uuid,
        "classificacao_id" uuid,
        "tipologia_id" uuid,
        "subtipologia_id" uuid,
        "programa_ppa" character varying,
        "acao_estrategica" character varying,
        "acao_orcamentaria" character varying,
        "unidade_medida" character varying,
        "quantidade" numeric(18,4),
        "secretario" character varying,
        "data_pactuada" date,
        "criado_por_usuario_id" uuid NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_obras" PRIMARY KEY ("id")
      )
    `);
    await executor.query(`CREATE UNIQUE INDEX${ifNotExists} "UQ_obras_codigo" ON "${schemaName}"."obras" ("codigo") WHERE "deleted_at" IS NULL`);
    await executor.query(`
      CREATE TABLE${ifNotExists} "${schemaName}"."obra_responsaveis" (
        "id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "obra_id" uuid NOT NULL,
        "usuario_id" uuid NOT NULL,
        "tipo" character varying NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_obra_responsaveis" PRIMARY KEY ("id")
      )
    `);
    await executor.query(`
      CREATE TABLE${ifNotExists} "${schemaName}"."obra_orcamentos" (
        "id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "obra_id" uuid NOT NULL,
        "fonte_id" uuid NOT NULL,
        "valor" character varying NOT NULL,
        CONSTRAINT "PK_obra_orcamentos" PRIMARY KEY ("id")
      )
    `);
    await executor.query(`
      CREATE TABLE${ifNotExists} "${schemaName}"."obra_seguidores" (
        "id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "obra_id" uuid NOT NULL,
        "usuario_id" uuid NOT NULL,
        "seguido_em" TIMESTAMP WITH TIME ZONE NOT NULL,
        CONSTRAINT "PK_obra_seguidores" PRIMARY KEY ("id")
      )
    `);
    await executor.query(`
      CREATE TABLE${ifNotExists} "${schemaName}"."tag" (
        "id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "nome" character varying NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tag" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_tag_tenant_nome" UNIQUE ("tenant_id", "nome")
      )
    `);
    await executor.query(`
      CREATE TABLE${ifNotExists} "${schemaName}"."obra_tag" (
        "id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "obra_id" uuid NOT NULL,
        "tag_id" uuid NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_obra_tag" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_obra_tag" UNIQUE ("obra_id", "tag_id")
      )
    `);
    await executor.query(`
      CREATE TABLE${ifNotExists} "${schemaName}"."observacao" (
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
    await executor.query(`CREATE INDEX${ifNotExists} "IDX_observacao_obra" ON "${schemaName}"."observacao" ("obra_id")`);
    await executor.query(`CREATE INDEX${ifNotExists} "IDX_obra_tag_obra" ON "${schemaName}"."obra_tag" ("obra_id")`);
    await executor.query(`CREATE INDEX${ifNotExists} "IDX_tag_tenant" ON "${schemaName}"."tag" ("tenant_id")`);
    await executor.query(`
      CREATE TABLE${ifNotExists} "${schemaName}"."obras_privadas" (
        "id" uuid NOT NULL,
        "codigo" character varying NOT NULL,
        "descricao" text NOT NULL,
        "observacoes" text,
        "proprietario_pessoa_id" uuid NOT NULL,
        "orgao_id" uuid,
        "inscricao_imobiliaria" character varying,
        "matricula_rgi" character varying,
        "cartorio" character varying,
        "cep" character varying,
        "logradouro" character varying NOT NULL,
        "numero" character varying,
        "complemento" character varying,
        "bairro" character varying,
        "localidade_id" uuid,
        "uf" character varying(2) NOT NULL,
        "latitude" character varying,
        "longitude" character varying,
        "geo_origem" character varying,
        "situacao_alvara" character varying NOT NULL DEFAULT 'SEM_ALVARA',
        "andamento" character varying,
        "habite_se" character varying,
        "data_inicio" character varying,
        "data_prevista_conclusao" character varying,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_obras_privadas" PRIMARY KEY ("id")
      )
    `);
    await executor.query(`CREATE UNIQUE INDEX${ifNotExists} "UQ_obras_privadas_codigo" ON "${schemaName}"."obras_privadas" ("codigo")`);
    await executor.query(`CREATE INDEX${ifNotExists} "IDX_obras_privadas_proprietario" ON "${schemaName}"."obras_privadas" ("proprietario_pessoa_id")`);
    await executor.query(`CREATE INDEX${ifNotExists} "IDX_obras_privadas_inscricao" ON "${schemaName}"."obras_privadas" ("inscricao_imobiliaria")`);
    await executor.query(`CREATE INDEX${ifNotExists} "IDX_obras_privadas_geo" ON "${schemaName}"."obras_privadas" ("latitude", "longitude")`);
  }
}
