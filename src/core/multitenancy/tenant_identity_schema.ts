interface SqlExecutor {
  query(query: string): Promise<unknown>;
}

export default abstract class TenantIdentitySchema {
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
    await executor.query(`SET LOCAL search_path TO "${schemaName}"`);

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
    await executor.query(
      `CREATE INDEX${ifNotExists} "IDX_pessoas_nome" ON "${schemaName}"."pessoas" ("nome")`,
    );
    await executor.query(`
      CREATE TABLE${ifNotExists} "${schemaName}"."profissionais_tecnicos" (
        "id" uuid NOT NULL,
        "pessoa_id" uuid NOT NULL,
        "conselho" character varying NOT NULL,
        "numero_registro" character varying NOT NULL,
        "uf_registro" character varying(2),
        "titulo" character varying,
        "ativo" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_profissionais_tecnicos" PRIMARY KEY ("id"),
        CONSTRAINT "FK_profissionais_tecnicos_pessoas" FOREIGN KEY ("pessoa_id") REFERENCES "${schemaName}"."pessoas"("id") ON DELETE RESTRICT
      )
    `);
    await executor.query(
      `CREATE UNIQUE INDEX${ifNotExists} "UQ_profissionais_tecnicos_pessoa" ON "${schemaName}"."profissionais_tecnicos" ("pessoa_id")`,
    );
    await executor.query(
      `CREATE INDEX${ifNotExists} "IDX_profissionais_tecnicos_registro" ON "${schemaName}"."profissionais_tecnicos" ("numero_registro")`,
    );
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
    await executor.query(
      `CREATE UNIQUE INDEX${ifNotExists} "UQ_obras_codigo" ON "${schemaName}"."obras" ("codigo") WHERE "deleted_at" IS NULL`,
    );
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
    await executor.query(
      `CREATE INDEX${ifNotExists} "IDX_observacao_obra" ON "${schemaName}"."observacao" ("obra_id")`,
    );
    await executor.query(
      `CREATE INDEX${ifNotExists} "IDX_obra_tag_obra" ON "${schemaName}"."obra_tag" ("obra_id")`,
    );
    await executor.query(
      `CREATE INDEX${ifNotExists} "IDX_tag_tenant" ON "${schemaName}"."tag" ("tenant_id")`,
    );
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
    await executor.query(
      `CREATE UNIQUE INDEX${ifNotExists} "UQ_obras_privadas_codigo" ON "${schemaName}"."obras_privadas" ("codigo")`,
    );
    await executor.query(
      `CREATE INDEX${ifNotExists} "IDX_obras_privadas_proprietario" ON "${schemaName}"."obras_privadas" ("proprietario_pessoa_id")`,
    );
    await executor.query(
      `CREATE INDEX${ifNotExists} "IDX_obras_privadas_inscricao" ON "${schemaName}"."obras_privadas" ("inscricao_imobiliaria")`,
    );
    await executor.query(
      `CREATE INDEX${ifNotExists} "IDX_obras_privadas_geo" ON "${schemaName}"."obras_privadas" ("latitude", "longitude")`,
    );
    await executor.query(`
      CREATE TABLE${ifNotExists} "${schemaName}"."alvara" (
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
        CONSTRAINT "PK_alvara" PRIMARY KEY ("id"),
        CONSTRAINT "FK_alvara_obras_privadas" FOREIGN KEY ("obra_privada_id")
          REFERENCES "${schemaName}"."obras_privadas"("id") ON DELETE CASCADE
      )
    `);
    await executor.query(
      `CREATE INDEX${ifNotExists} "IDX_alvara_obra" ON "${schemaName}"."alvara" ("obra_privada_id")`,
    );
    await executor.query(
      `CREATE UNIQUE INDEX${ifNotExists} "UQ_alvara_numero_ano" ON "${schemaName}"."alvara" ("tenant_id", "ano", "numero") WHERE "numero" IS NOT NULL`,
    );
    await executor.query(`
      CREATE TABLE${ifNotExists} "${schemaName}"."fiscalizacao" (
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
        CONSTRAINT "PK_fiscalizacao" PRIMARY KEY ("id"),
        CONSTRAINT "FK_fiscalizacao_obras_privadas" FOREIGN KEY ("obra_privada_id")
          REFERENCES "${schemaName}"."obras_privadas"("id") ON DELETE CASCADE
      )
    `);
    await executor.query(
      `CREATE UNIQUE INDEX${ifNotExists} "UQ_fiscalizacao_numero" ON "${schemaName}"."fiscalizacao" ("tenant_id", "numero")`,
    );
    await executor.query(
      `CREATE INDEX${ifNotExists} "IDX_fiscalizacao_obra" ON "${schemaName}"."fiscalizacao" ("tenant_id", "obra_privada_id", "data_fiscalizacao")`,
    );
    await executor.query(`
      CREATE TABLE${ifNotExists} "${schemaName}"."obra_privada_observacao" (
        "id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "obra_privada_id" uuid NOT NULL,
        "texto" text NOT NULL,
        "autor_usuario_id" uuid NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_obra_privada_observacao" PRIMARY KEY ("id"),
        CONSTRAINT "FK_obra_privada_observacao_obras_privadas" FOREIGN KEY ("obra_privada_id")
          REFERENCES "${schemaName}"."obras_privadas"("id") ON DELETE CASCADE
      )
    `);
    await executor.query(
      `CREATE INDEX${ifNotExists} "IDX_obra_privada_observacao_obra" ON "${schemaName}"."obra_privada_observacao" ("tenant_id", "obra_privada_id")`,
    );
    await executor.query(`
      CREATE TABLE${ifNotExists} "${schemaName}"."auto_infracao" (
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
        CONSTRAINT "PK_auto_infracao" PRIMARY KEY ("id"),
        CONSTRAINT "FK_auto_infracao_obras_privadas" FOREIGN KEY ("obra_privada_id")
          REFERENCES "${schemaName}"."obras_privadas"("id") ON DELETE CASCADE
      )
    `);
    await executor.query(
      `CREATE UNIQUE INDEX${ifNotExists} "UQ_auto_infracao_numero" ON "${schemaName}"."auto_infracao" ("tenant_id", "numero")`,
    );
    await executor.query(
      `CREATE INDEX${ifNotExists} "IDX_auto_infracao_obra" ON "${schemaName}"."auto_infracao" ("tenant_id", "obra_privada_id")`,
    );
    await executor.query(
      `CREATE INDEX${ifNotExists} "IDX_auto_infracao_prazo" ON "${schemaName}"."auto_infracao" ("tenant_id", "situacao", "data_limite")`,
    );
    await executor.query(`
      CREATE TABLE${ifNotExists} "${schemaName}"."habite_se" (
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
        CONSTRAINT "PK_habite_se" PRIMARY KEY ("id"),
        CONSTRAINT "FK_habite_se_obras_privadas" FOREIGN KEY ("obra_privada_id")
          REFERENCES "${schemaName}"."obras_privadas"("id") ON DELETE CASCADE
      )
    `);
    await executor.query(
      `CREATE INDEX${ifNotExists} "IDX_habite_se_obra" ON "${schemaName}"."habite_se" ("obra_privada_id")`,
    );
    await executor.query(`
      CREATE TABLE${ifNotExists} "${schemaName}"."obra_privada_responsavel" (
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
        CONSTRAINT "PK_obra_privada_responsavel" PRIMARY KEY ("id"),
        CONSTRAINT "FK_obra_privada_responsavel_obras_privadas" FOREIGN KEY ("obra_privada_id")
          REFERENCES "${schemaName}"."obras_privadas"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_obra_privada_responsavel_profissionais" FOREIGN KEY ("profissional_tecnico_id")
          REFERENCES "${schemaName}"."profissionais_tecnicos"("id") ON DELETE RESTRICT
      )
    `);
    await executor.query(
      `CREATE INDEX${ifNotExists} "IDX_obra_privada_responsavel_obra" ON "${schemaName}"."obra_privada_responsavel" ("tenant_id", "obra_privada_id")`,
    );
    await this.createGuiasCadastrosTables(executor, schemaName, ifNotExists);
    await this.createAttachmentsTable(executor, schemaName, ifNotExists);
    await this.createDocumentosTables(executor, schemaName, ifNotExists);
  }

  static async createGuiasCadastrosTables(
    executor: SqlExecutor,
    schemaName: string,
    ifNotExists = ' IF NOT EXISTS',
  ): Promise<void> {
    if (!/^tenant_[0-9a-f]{32}$/.test(schemaName)) {
      throw new Error('Invalid tenant schema name');
    }
    await executor.query(`SET LOCAL search_path TO "${schemaName}"`);
    await executor.query(`
      CREATE TABLE${ifNotExists} "${schemaName}"."eixo" (
        "id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "nome" character varying NOT NULL,
        "ativo" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_eixo" PRIMARY KEY ("id")
      )
    `);
    await executor.query(
      `CREATE INDEX${ifNotExists} "IDX_eixo_tenant" ON "${schemaName}"."eixo" ("tenant_id")`,
    );
    await executor.query(`
      CREATE TABLE${ifNotExists} "${schemaName}"."classificacao" (
        "id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "nome" character varying NOT NULL,
        "ativo" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_classificacao" PRIMARY KEY ("id")
      )
    `);
    await executor.query(
      `CREATE INDEX${ifNotExists} "IDX_classificacao_tenant" ON "${schemaName}"."classificacao" ("tenant_id")`,
    );
    await executor.query(`
      CREATE TABLE${ifNotExists} "${schemaName}"."subclassificacao" (
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
    await executor.query(
      `CREATE INDEX${ifNotExists} "IDX_subclassificacao_tenant" ON "${schemaName}"."subclassificacao" ("tenant_id")`,
    );
    await executor.query(
      `CREATE INDEX${ifNotExists} "IDX_subclassificacao_parent" ON "${schemaName}"."subclassificacao" ("classificacao_id")`,
    );
    await executor.query(`
      CREATE TABLE${ifNotExists} "${schemaName}"."tipologia" (
        "id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "nome" character varying NOT NULL,
        "ativo" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tipologia" PRIMARY KEY ("id")
      )
    `);
    await executor.query(
      `CREATE INDEX${ifNotExists} "IDX_tipologia_tenant" ON "${schemaName}"."tipologia" ("tenant_id")`,
    );
    await executor.query(`
      CREATE TABLE${ifNotExists} "${schemaName}"."subtipologia" (
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
    await executor.query(
      `CREATE INDEX${ifNotExists} "IDX_subtipologia_tenant" ON "${schemaName}"."subtipologia" ("tenant_id")`,
    );
    await executor.query(
      `CREATE INDEX${ifNotExists} "IDX_subtipologia_parent" ON "${schemaName}"."subtipologia" ("tipologia_id")`,
    );
    await executor.query(`
      CREATE TABLE${ifNotExists} "${schemaName}"."obra_localizacao" (
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
    await executor.query(
      `CREATE INDEX${ifNotExists} "IDX_obra_localizacao_obra" ON "${schemaName}"."obra_localizacao" ("obra_id")`,
    );
    await executor.query(`
      CREATE TABLE${ifNotExists} "${schemaName}"."obra_orcamento_previsto" (
        "id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "obra_id" uuid NOT NULL,
        "fonte_id" uuid NOT NULL,
        "valor" numeric(18,2) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_obra_orcamento_previsto" PRIMARY KEY ("id")
      )
    `);
    await executor.query(
      `CREATE INDEX${ifNotExists} "IDX_obra_orcamento_obra" ON "${schemaName}"."obra_orcamento_previsto" ("obra_id")`,
    );
    await executor.query(`
      CREATE TABLE${ifNotExists} "${schemaName}"."titularidade" (
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
    await executor.query(`
      CREATE TABLE${ifNotExists} "${schemaName}"."licenca" (
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
    await executor.query(
      `CREATE INDEX${ifNotExists} "IDX_licenca_obra" ON "${schemaName}"."licenca" ("obra_id")`,
    );
    await executor.query(`
      CREATE TABLE${ifNotExists} "${schemaName}"."recebimento" (
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
    await executor.query(
      `CREATE INDEX${ifNotExists} "IDX_recebimento_obra" ON "${schemaName}"."recebimento" ("obra_id")`,
    );
  }

  static async createAttachmentsTable(
    executor: SqlExecutor,
    schemaName: string,
    ifNotExists = ' IF NOT EXISTS',
  ): Promise<void> {
    if (!/^tenant_[0-9a-f]{32}$/.test(schemaName)) {
      throw new Error('Invalid tenant schema name');
    }
    await executor.query(`SET LOCAL search_path TO "${schemaName}"`);
    await executor.query(`
      CREATE TABLE${ifNotExists} "${schemaName}"."attachments" (
        "id" uuid NOT NULL,
        "file_url" character varying NOT NULL,
        "original_name" character varying NOT NULL,
        "entity_type" character varying NOT NULL,
        "entity_id" uuid NOT NULL,
        "created_by" uuid NOT NULL,
        "updated_by" uuid NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_attachments" PRIMARY KEY ("id")
      )
    `);
    await executor.query(
      `CREATE INDEX${ifNotExists} "IDX_attachments_entity" ON "${schemaName}"."attachments" ("entity_type", "entity_id")`,
    );
    await executor.query(
      `CREATE INDEX${ifNotExists} "IDX_attachments_file_url" ON "${schemaName}"."attachments" ("file_url")`,
    );
  }

  static async createDocumentosTables(
    executor: SqlExecutor,
    schemaName: string,
    ifNotExists = ' IF NOT EXISTS',
  ): Promise<void> {
    if (!/^tenant_[0-9a-f]{32}$/.test(schemaName)) {
      throw new Error('Invalid tenant schema name');
    }
    await executor.query(`SET LOCAL search_path TO "${schemaName}"`);
    await executor.query(`
      CREATE TABLE${ifNotExists} "${schemaName}"."pasta" (
        "id" uuid NOT NULL,
        "obra_id" uuid NOT NULL,
        "pasta_pai_id" uuid,
        "nome" character varying NOT NULL,
        "criado_por_usuario_id" uuid,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_pasta" PRIMARY KEY ("id")
      )
    `);
    await executor.query(
      `CREATE INDEX${ifNotExists} "IDX_pasta_obra" ON "${schemaName}"."pasta" ("obra_id")`,
    );
    await executor.query(
      `CREATE INDEX${ifNotExists} "IDX_pasta_pai" ON "${schemaName}"."pasta" ("pasta_pai_id")`,
    );
    await executor.query(
      `CREATE UNIQUE INDEX${ifNotExists} "UQ_pasta_raiz_obra" ON "${schemaName}"."pasta" ("obra_id") WHERE "pasta_pai_id" IS NULL`,
    );
    await executor.query(`
      CREATE TABLE${ifNotExists} "${schemaName}"."arquivo" (
        "id" uuid NOT NULL,
        "obra_id" uuid NOT NULL,
        "pasta_id" uuid NOT NULL,
        "nome" character varying NOT NULL,
        "descricao" text,
        "nome_original" character varying NOT NULL,
        "mime_type" character varying,
        "tamanho_bytes" bigint,
        "storage_key" character varying NOT NULL,
        "attachment_id" uuid,
        "enviado_por_usuario_id" uuid NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_arquivo" PRIMARY KEY ("id")
      )
    `);
    await executor.query(
      `CREATE INDEX${ifNotExists} "IDX_arquivo_obra" ON "${schemaName}"."arquivo" ("obra_id")`,
    );
    await executor.query(
      `CREATE INDEX${ifNotExists} "IDX_arquivo_pasta" ON "${schemaName}"."arquivo" ("pasta_id")`,
    );
  }
}
