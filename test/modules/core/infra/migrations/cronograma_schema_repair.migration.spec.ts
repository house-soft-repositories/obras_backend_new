import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import RepairCronogramaTenantSchema1781840000000 from '@/core/database/migrations/1781840000000-repair_cronograma_tenant_schema';

describe('RepairCronogramaTenantSchema1781840000000', () => {
  const tenantId = randomUUID();
  const schemaName = `tenant_${tenantId.replaceAll('-', '')}`;
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  });

  beforeAll(async () => {
    await dataSource.initialize();
    await dataSource.query(`CREATE SCHEMA "${schemaName}"`);
    await dataSource.query(
      `INSERT INTO public.tenancies (id, name, slug, schema_name)
       VALUES ($1, 'Cronograma Repair Tenant', $2, $3)`,
      [tenantId, `cronograma-repair-${tenantId}`, schemaName],
    );
    await dataSource.query(`
      CREATE TABLE "${schemaName}"."estagio" (
        id uuid PRIMARY KEY, criado_em timestamptz NOT NULL, atualizado_em timestamptz NOT NULL
      );
      CREATE TABLE "${schemaName}"."estagio_acompanhamento" (
        id uuid PRIMARY KEY, criado_em timestamptz NOT NULL
      );
      CREATE TABLE "${schemaName}"."estagio_comentario" (
        id uuid PRIMARY KEY, criado_em timestamptz NOT NULL
      );
      CREATE TABLE "${schemaName}"."medicao" (
        id uuid PRIMARY KEY, data_medicao date NOT NULL, criado_em timestamptz NOT NULL,
        atualizado_em timestamptz NOT NULL
      );
      CREATE TABLE "${schemaName}"."medicao_fonte" (
        id uuid PRIMARY KEY, criado_em timestamptz NOT NULL, atualizado_em timestamptz NOT NULL
      );
    `);
  });

  afterAll(async () => {
    if (!dataSource.isInitialized) return;
    await dataSource.query(`DELETE FROM public.tenancies WHERE id = $1::uuid`, [
      tenantId,
    ]);
    await dataSource.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
    await dataSource.destroy();
  });

  it('repairs legacy columns and is idempotent', async () => {
    const migration = new RepairCronogramaTenantSchema1781840000000();
    const queryRunner = dataSource.createQueryRunner();

    await migration.up(queryRunner);
    await migration.up(queryRunner);

    const columns = (await queryRunner.query(
      `SELECT table_name, column_name
       FROM information_schema.columns
       WHERE table_schema = $1
       ORDER BY table_name, ordinal_position`,
      [schemaName],
    )) as { table_name: string; column_name: string }[];
    const names = new Set(
      columns.map(
        ({ table_name, column_name }) => `${table_name}.${column_name}`,
      ),
    );

    for (const column of [
      'estagio.estagio_pai_id',
      'estagio.created_at',
      'estagio.updated_at',
      'estagio_acompanhamento.created_at',
      'estagio_acompanhamento.updated_at',
      'estagio_comentario.created_at',
      'estagio_comentario.updated_at',
      'medicao.data',
      'medicao.created_at',
      'medicao.updated_at',
      'medicao_fonte.created_at',
      'medicao_fonte.updated_at',
    ]) {
      expect(names.has(column)).toBe(true);
    }
    expect(names.has('estagio.criado_em')).toBe(false);
    expect(names.has('estagio.atualizado_em')).toBe(false);
    expect(names.has('medicao.data_medicao')).toBe(false);

    await queryRunner.release();
  });
});
