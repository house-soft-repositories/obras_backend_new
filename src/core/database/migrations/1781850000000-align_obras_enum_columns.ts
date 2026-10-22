import { MigrationInterface, QueryRunner } from 'typeorm';

type TenantRow = { schema_name: string };
type ColumnRow = { data_type: string; udt_name: string };

export default class AlignObrasEnumColumns1781850000000
  implements MigrationInterface
{
  name = 'AlignObrasEnumColumns1781850000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const tenancies = (await queryRunner.query(
      'SELECT schema_name FROM public.tenancies',
    )) as TenantRow[];

    for (const { schema_name: schemaName } of tenancies) {
      if (!/^tenant_[0-9a-f]{32}$/.test(schemaName)) continue;

      await queryRunner.query(`
        DO $$ BEGIN
          CREATE TYPE "${schemaName}"."obras_tipo_enum" AS ENUM (
            'AQUISICAO', 'INVESTIMENTO_PRIVADO', 'OBRA',
            'PROGRAMA_PROJETO', 'SERVICOS'
          );
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
      `);
      await queryRunner.query(`
        DO $$ BEGIN
          CREATE TYPE "${schemaName}"."obras_status_enum" AS ENUM (
            'EM_ABERTO', 'EM_DESENVOLVIMENTO', 'CONCLUIDO',
            'PARALISADO', 'CANCELADO'
          );
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
      `);

      const obrasTable = await this.tableExists(queryRunner, schemaName);
      if (!obrasTable) continue;

      await this.convertColumn(
        queryRunner,
        schemaName,
        'tipo',
        'obras_tipo_enum',
      );
      await this.convertColumn(
        queryRunner,
        schemaName,
        'status',
        'obras_status_enum',
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const tenancies = (await queryRunner.query(
      'SELECT schema_name FROM public.tenancies',
    )) as TenantRow[];

    for (const { schema_name: schemaName } of tenancies) {
      if (!/^tenant_[0-9a-f]{32}$/.test(schemaName)) continue;
      if (!(await this.tableExists(queryRunner, schemaName))) continue;

      await queryRunner.query(
        `ALTER TABLE "${schemaName}"."obras" ALTER COLUMN "tipo" TYPE character varying USING "tipo"::text`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schemaName}"."obras" ALTER COLUMN "status" TYPE character varying USING "status"::text`,
      );
      await queryRunner.query(
        `DROP TYPE IF EXISTS "${schemaName}"."obras_tipo_enum"`,
      );
      await queryRunner.query(
        `DROP TYPE IF EXISTS "${schemaName}"."obras_status_enum"`,
      );
    }
  }

  private async tableExists(
    queryRunner: QueryRunner,
    schemaName: string,
  ): Promise<boolean> {
    const rows = (await queryRunner.query(
      'SELECT to_regclass($1) IS NOT NULL AS exists',
      [`"${schemaName}"."obras"`],
    )) as { exists: boolean }[];
    return rows[0]?.exists === true;
  }

  private async convertColumn(
    queryRunner: QueryRunner,
    schemaName: string,
    columnName: 'tipo' | 'status',
    enumName: 'obras_tipo_enum' | 'obras_status_enum',
  ): Promise<void> {
    const columns = (await queryRunner.query(
      `
        SELECT data_type, udt_name
        FROM information_schema.columns
        WHERE table_schema = $1
          AND table_name = 'obras'
          AND column_name = $2
      `,
      [schemaName, columnName],
    )) as ColumnRow[];
    const column = columns[0];
    if (!column || column.udt_name === enumName) return;
    if (column.data_type !== 'character varying') return;

    await queryRunner.query(
      `ALTER TABLE "${schemaName}"."obras" ALTER COLUMN "${columnName}" TYPE "${schemaName}"."${enumName}" USING "${columnName}"::text::"${schemaName}"."${enumName}"`,
    );
  }
}
