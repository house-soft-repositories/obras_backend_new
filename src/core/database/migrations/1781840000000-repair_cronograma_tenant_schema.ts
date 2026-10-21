import { MigrationInterface, QueryRunner } from 'typeorm';

type TenantRow = { schema_name: string };

export default class RepairCronogramaTenantSchema1781840000000
  implements MigrationInterface
{
  name = 'RepairCronogramaTenantSchema1781840000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const tenancies = (await queryRunner.query(
      'SELECT schema_name FROM public.tenancies',
    )) as TenantRow[];

    for (const { schema_name: schema } of tenancies) {
      if (!/^tenant_[0-9a-f]{32}$/.test(schema)) continue;

      await this.renameLegacyColumn(
        queryRunner,
        schema,
        'estagio',
        'criado_em',
        'created_at',
      );
      await this.renameLegacyColumn(
        queryRunner,
        schema,
        'estagio',
        'atualizado_em',
        'updated_at',
      );
      await this.renameLegacyColumn(
        queryRunner,
        schema,
        'medicao',
        'criado_em',
        'created_at',
      );
      await this.renameLegacyColumn(
        queryRunner,
        schema,
        'medicao',
        'atualizado_em',
        'updated_at',
      );

      for (const table of ['estagio_acompanhamento', 'estagio_comentario']) {
        await this.renameLegacyColumn(
          queryRunner,
          schema,
          table,
          'criado_em',
          'created_at',
        );
        await this.renameLegacyColumn(
          queryRunner,
          schema,
          table,
          'atualizado_em',
          'updated_at',
        );
      }

      for (const table of ['medicao_fonte']) {
        await this.renameLegacyColumn(
          queryRunner,
          schema,
          table,
          'criado_em',
          'created_at',
        );
        await this.renameLegacyColumn(
          queryRunner,
          schema,
          table,
          'atualizado_em',
          'updated_at',
        );
      }

      await this.renameLegacyColumn(
        queryRunner,
        schema,
        'medicao',
        'data_medicao',
        'data',
      );

      await this.addColumns(queryRunner, schema, 'estagio', [
        '"estagio_pai_id" uuid',
        '"created_at" timestamptz NOT NULL DEFAULT now()',
        '"updated_at" timestamptz NOT NULL DEFAULT now()',
      ]);
      await this.addColumns(queryRunner, schema, 'estagio_acompanhamento', [
        '"created_at" timestamptz NOT NULL DEFAULT now()',
        '"updated_at" timestamptz NOT NULL DEFAULT now()',
      ]);
      await this.addColumns(queryRunner, schema, 'estagio_comentario', [
        '"created_at" timestamptz NOT NULL DEFAULT now()',
        '"updated_at" timestamptz NOT NULL DEFAULT now()',
      ]);
      await this.addColumns(queryRunner, schema, 'medicao', [
        '"data" date NOT NULL DEFAULT CURRENT_DATE',
        '"created_at" timestamptz NOT NULL DEFAULT now()',
        '"updated_at" timestamptz NOT NULL DEFAULT now()',
      ]);
      await this.addColumns(queryRunner, schema, 'medicao_fonte', [
        '"created_at" timestamptz NOT NULL DEFAULT now()',
        '"updated_at" timestamptz NOT NULL DEFAULT now()',
      ]);
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const tenancies = (await queryRunner.query(
      'SELECT schema_name FROM public.tenancies',
    )) as TenantRow[];

    for (const { schema_name: schema } of tenancies) {
      if (!/^tenant_[0-9a-f]{32}$/.test(schema)) continue;
      await queryRunner.query(
        `ALTER TABLE "${schema}"."estagio" DROP COLUMN IF EXISTS "estagio_pai_id"`,
      );
    }
  }

  private async renameLegacyColumn(
    queryRunner: QueryRunner,
    schema: string,
    table: string,
    legacyColumn: string,
    currentColumn: string,
  ): Promise<void> {
    if (!(await this.tableExists(queryRunner, schema, table))) return;
    const columns = (await queryRunner.query(
      `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = $2
          AND column_name IN ($3, $4)
      `,
      [schema, table, legacyColumn, currentColumn],
    )) as { column_name: string }[];
    const names = new Set(columns.map(({ column_name }) => column_name));
    if (!names.has(legacyColumn) || names.has(currentColumn)) return;
    await queryRunner.query(
      `ALTER TABLE "${schema}"."${table}" RENAME COLUMN "${legacyColumn}" TO "${currentColumn}"`,
    );
  }

  private async addColumns(
    queryRunner: QueryRunner,
    schema: string,
    table: string,
    columns: string[],
  ): Promise<void> {
    if (!(await this.tableExists(queryRunner, schema, table))) return;
    await queryRunner.query(
      `ALTER TABLE "${schema}"."${table}" ${columns
        .map((column) => `ADD COLUMN IF NOT EXISTS ${column}`)
        .join(', ')}`,
    );
  }

  private async tableExists(
    queryRunner: QueryRunner,
    schema: string,
    table: string,
  ): Promise<boolean> {
    const rows = (await queryRunner.query(
      'SELECT to_regclass($1) IS NOT NULL AS exists',
      [`"${schema}"."${table}"`],
    )) as { exists: boolean }[];
    return rows[0]?.exists === true;
  }
}
