import { MigrationInterface, QueryRunner } from 'typeorm';

type ForeignKeyDefinition = {
  name: string;
  schema: string;
  table: string;
  columns: string[];
  referencedSchema: string;
  referencedTable: string;
  referencedColumns?: string[];
};

export default class AddRelationalForeignKeys1781700000000
  implements MigrationInterface
{
  name = 'AddRelationalForeignKeys1781700000000';

  private readonly tenantForeignKeys = [
    { name: 'FK_orgaos_localidades', table: 'orgaos', columns: ['localidade_id'], referencedTable: 'localidades' },
    { name: 'FK_setores_orgaos', table: 'setores', columns: ['orgao_id'], referencedTable: 'orgaos' },
    { name: 'FK_obras_orgaos', table: 'obras', columns: ['orgao_id'], referencedTable: 'orgaos' },
    { name: 'FK_obras_setores', table: 'obras', columns: ['setor_id'], referencedTable: 'setores' },
    { name: 'FK_obras_localidades', table: 'obras', columns: ['localidade_id'], referencedTable: 'localidades' },
    { name: 'FK_obras_subclassificacao', table: 'obras', columns: ['subclassificacao_id'], referencedTable: 'subclassificacao' },
    { name: 'FK_obras_eixo', table: 'obras', columns: ['eixo_id'], referencedTable: 'eixo' },
    { name: 'FK_obras_classificacao', table: 'obras', columns: ['classificacao_id'], referencedTable: 'classificacao' },
    { name: 'FK_obras_tipologia', table: 'obras', columns: ['tipologia_id'], referencedTable: 'tipologia' },
    { name: 'FK_obras_subtipologia', table: 'obras', columns: ['subtipologia_id'], referencedTable: 'subtipologia' },
    { name: 'FK_obras_criado_por_usuario', table: 'obras', columns: ['criado_por_usuario_id'], referencedSchema: 'public', referencedTable: 'users' },
    { name: 'FK_obra_responsaveis_obras', table: 'obra_responsaveis', columns: ['obra_id'], referencedTable: 'obras' },
    { name: 'FK_obra_responsaveis_users', table: 'obra_responsaveis', columns: ['usuario_id'], referencedSchema: 'public', referencedTable: 'users' },
    { name: 'FK_obra_orcamentos_obras', table: 'obra_orcamentos', columns: ['obra_id'], referencedTable: 'obras' },
    { name: 'FK_obra_orcamentos_fontes', table: 'obra_orcamentos', columns: ['fonte_id'], referencedTable: 'fontes' },
    { name: 'FK_obra_seguidores_obras', table: 'obra_seguidores', columns: ['obra_id'], referencedTable: 'obras' },
    { name: 'FK_obra_seguidores_users', table: 'obra_seguidores', columns: ['usuario_id'], referencedSchema: 'public', referencedTable: 'users' },
    { name: 'FK_obra_tag_obras', table: 'obra_tag', columns: ['obra_id'], referencedTable: 'obras' },
    { name: 'FK_obra_tag_tag', table: 'obra_tag', columns: ['tag_id'], referencedTable: 'tag' },
    { name: 'FK_observacao_obras', table: 'observacao', columns: ['obra_id'], referencedTable: 'obras' },
    { name: 'FK_observacao_users', table: 'observacao', columns: ['autor_usuario_id'], referencedSchema: 'public', referencedTable: 'users' },
    { name: 'FK_subclassificacao_classificacao', table: 'subclassificacao', columns: ['classificacao_id'], referencedTable: 'classificacao' },
    { name: 'FK_subtipologia_tipologia', table: 'subtipologia', columns: ['tipologia_id'], referencedTable: 'tipologia' },
    { name: 'FK_obras_privadas_pessoas', table: 'obras_privadas', columns: ['proprietario_pessoa_id'], referencedTable: 'pessoas' },
    { name: 'FK_obras_privadas_orgaos', table: 'obras_privadas', columns: ['orgao_id'], referencedTable: 'orgaos' },
    { name: 'FK_obras_privadas_localidades', table: 'obras_privadas', columns: ['localidade_id'], referencedTable: 'localidades' },
    { name: 'FK_obra_localizacao_obras', table: 'obra_localizacao', columns: ['obra_id'], referencedTable: 'obras' },
    { name: 'FK_obra_orcamento_previsto_obras', table: 'obra_orcamento_previsto', columns: ['obra_id'], referencedTable: 'obras' },
    { name: 'FK_obra_orcamento_previsto_fontes', table: 'obra_orcamento_previsto', columns: ['fonte_id'], referencedTable: 'fontes' },
    { name: 'FK_titularidade_obras', table: 'titularidade', columns: ['obra_id'], referencedTable: 'obras' },
    { name: 'FK_licenca_obras', table: 'licenca', columns: ['obra_id'], referencedTable: 'obras' },
    { name: 'FK_recebimento_obras', table: 'recebimento', columns: ['obra_id'], referencedTable: 'obras' },
    { name: 'FK_contrato_obras', table: 'contrato', columns: ['obra_id'], referencedTable: 'obras' },
    { name: 'FK_contrato_empresa_contratada', table: 'contrato', columns: ['empresa_contratada_id'], referencedTable: 'empresa_contratada' },
    { name: 'FK_contrato_fonte_contrato', table: 'contrato_fonte', columns: ['contrato_id'], referencedTable: 'contrato' },
    { name: 'FK_contrato_fonte_fontes', table: 'contrato_fonte', columns: ['fonte_id'], referencedTable: 'fontes' },
    { name: 'FK_aditivo_contrato', table: 'aditivo', columns: ['contrato_id'], referencedTable: 'contrato' },
    { name: 'FK_aditivo_fonte_aditivo', table: 'aditivo_fonte', columns: ['aditivo_id'], referencedTable: 'aditivo' },
    { name: 'FK_aditivo_fonte_fontes', table: 'aditivo_fonte', columns: ['fonte_id'], referencedTable: 'fontes' },
    { name: 'FK_paralisacao_contrato', table: 'paralisacao', columns: ['contrato_id'], referencedTable: 'contrato' },
    { name: 'FK_paralisacao_termo_paralisacao', table: 'paralisacao', columns: ['termo_paralisacao_arquivo_id'], referencedTable: 'attachments' },
    { name: 'FK_paralisacao_termo_retomada', table: 'paralisacao', columns: ['termo_retomada_arquivo_id'], referencedTable: 'attachments' },
    { name: 'FK_estagio_obras', table: 'estagio', columns: ['obra_id'], referencedTable: 'obras' },
    { name: 'FK_estagio_responsavel_user', table: 'estagio', columns: ['responsavel_usuario_id'], referencedSchema: 'public', referencedTable: 'users' },
    { name: 'FK_estagio_acompanhamento_obras', table: 'estagio_acompanhamento', columns: ['obra_id'], referencedTable: 'obras' },
    { name: 'FK_estagio_acompanhamento_estagio', table: 'estagio_acompanhamento', columns: ['estagio_id'], referencedTable: 'estagio' },
    { name: 'FK_estagio_acompanhamento_users', table: 'estagio_acompanhamento', columns: ['autor_usuario_id'], referencedSchema: 'public', referencedTable: 'users' },
    { name: 'FK_estagio_comentario_obras', table: 'estagio_comentario', columns: ['obra_id'], referencedTable: 'obras' },
    { name: 'FK_estagio_comentario_estagio', table: 'estagio_comentario', columns: ['estagio_id'], referencedTable: 'estagio' },
    { name: 'FK_estagio_comentario_users', table: 'estagio_comentario', columns: ['autor_usuario_id'], referencedSchema: 'public', referencedTable: 'users' },
    { name: 'FK_medicao_obras', table: 'medicao', columns: ['obra_id'], referencedTable: 'obras' },
    { name: 'FK_medicao_fonte_medicao', table: 'medicao_fonte', columns: ['medicao_id'], referencedTable: 'medicao' },
    { name: 'FK_medicao_fonte_fontes', table: 'medicao_fonte', columns: ['fonte_id'], referencedTable: 'fontes' },
    { name: 'FK_attachments_created_by_users', table: 'attachments', columns: ['created_by'], referencedSchema: 'public', referencedTable: 'users' },
    { name: 'FK_attachments_updated_by_users', table: 'attachments', columns: ['updated_by'], referencedSchema: 'public', referencedTable: 'users' },
  ] satisfies Array<
    Omit<ForeignKeyDefinition, 'schema' | 'referencedSchema'> & {
      referencedSchema?: string;
    }
  >;

  private readonly publicForeignKeys: ForeignKeyDefinition[] = [
    { name: 'FK_users_tenancies', schema: 'public', table: 'users', columns: ['tenant_id'], referencedSchema: 'public', referencedTable: 'tenancies' },
    { name: 'FK_user_sessions_users', schema: 'public', table: 'user_sessions', columns: ['user_id'], referencedSchema: 'public', referencedTable: 'users' },
  ];

  private readonly tenantScopedTables = [
    'fontes',
    'pessoas',
    'obras',
    'obra_responsaveis',
    'obra_orcamentos',
    'obra_seguidores',
    'tag',
    'obra_tag',
    'observacao',
    'obras_privadas',
    'eixo',
    'classificacao',
    'subclassificacao',
    'tipologia',
    'subtipologia',
    'obra_localizacao',
    'obra_orcamento_previsto',
    'titularidade',
    'licenca',
    'recebimento',
    'attachments',
    'empresa_contratada',
    'empresa_contratada_telefone',
    'contrato',
    'contrato_fonte',
    'aditivo',
    'aditivo_fonte',
    'paralisacao',
    'estagio',
    'estagio_acompanhamento',
    'estagio_comentario',
    'medicao',
    'medicao_fonte',
  ];

  async up(queryRunner: QueryRunner): Promise<void> {
    for (const foreignKey of this.publicForeignKeys) {
      await this.recreateForeignKey(queryRunner, foreignKey);
    }

    const tenancies = (await queryRunner.query(
      'SELECT schema_name FROM public.tenancies',
    )) as { schema_name: string }[];

    for (const { schema_name: schema } of tenancies) {
      if (!/^tenant_[0-9a-f]{32}$/.test(schema)) continue;
      for (const table of this.tenantScopedTables) {
        await this.recreateForeignKey(queryRunner, {
          name: `FK_${table}_tenant`,
          schema,
          table,
          columns: ['tenant_id'],
          referencedSchema: 'public',
          referencedTable: 'tenancies',
        });
      }
      for (const foreignKey of this.tenantForeignKeys) {
        await this.recreateForeignKey(queryRunner, {
          ...foreignKey,
          schema,
          referencedSchema: foreignKey.referencedSchema ?? schema,
        });
      }
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const tenancies = (await queryRunner.query(
      'SELECT schema_name FROM public.tenancies',
    )) as { schema_name: string }[];

    for (const { schema_name: schema } of tenancies) {
      if (!/^tenant_[0-9a-f]{32}$/.test(schema)) continue;
      for (const foreignKey of [...this.tenantForeignKeys].reverse()) {
        await this.dropForeignKeyIfExists(queryRunner, schema, foreignKey.name);
      }
      for (const table of [...this.tenantScopedTables].reverse()) {
        await this.dropForeignKeyIfExists(queryRunner, schema, `FK_${table}_tenant`);
      }
    }

    for (const foreignKey of [...this.publicForeignKeys].reverse()) {
      await this.dropForeignKeyIfExists(
        queryRunner,
        foreignKey.schema,
        foreignKey.name,
      );
    }
  }

  private async recreateForeignKey(
    queryRunner: QueryRunner,
    foreignKey: ForeignKeyDefinition,
  ): Promise<void> {
    const referencedColumns = foreignKey.referencedColumns ?? ['id'];
    await this.dropForeignKeyIfExists(queryRunner, foreignKey.schema, foreignKey.name);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('${foreignKey.schema}.${foreignKey.table}') IS NOT NULL
          AND to_regclass('${foreignKey.referencedSchema}.${foreignKey.referencedTable}') IS NOT NULL
          AND ${foreignKey.columns
            .map(
              (column) =>
                `EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = '${foreignKey.schema}' AND table_name = '${foreignKey.table}' AND column_name = '${column}')`,
            )
            .join(' AND ')}
        THEN
          ALTER TABLE "${foreignKey.schema}"."${foreignKey.table}"
          ADD CONSTRAINT "${foreignKey.name}"
          FOREIGN KEY (${foreignKey.columns.map((column) => `"${column}"`).join(', ')})
          REFERENCES "${foreignKey.referencedSchema}"."${foreignKey.referencedTable}"
            (${referencedColumns.map((column) => `"${column}"`).join(', ')})
          ON DELETE CASCADE;
        END IF;
      END $$;
    `);
  }

  private async dropForeignKeyIfExists(
    queryRunner: QueryRunner,
    schema: string,
    constraintName: string,
  ): Promise<void> {
    await queryRunner.query(`
      DO $$
      DECLARE target_table text;
      BEGIN
        SELECT c.relname INTO target_table
        FROM pg_constraint con
        JOIN pg_class c ON c.oid = con.conrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = '${schema}'
          AND con.conname = '${constraintName}'
          AND con.contype = 'f'
        LIMIT 1;

        IF target_table IS NOT NULL THEN
          EXECUTE format(
            'ALTER TABLE %I.%I DROP CONSTRAINT %I',
            '${schema}',
            target_table,
            '${constraintName}'
          );
        END IF;
      END $$;
    `);
  }
}
