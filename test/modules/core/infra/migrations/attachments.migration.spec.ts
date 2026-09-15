import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import Attachments1781600000000 from '@/core/database/migrations/1781600000000-attachments';

describe('Attachments1781600000000', () => {
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
       VALUES ($1, 'Attachments Tenant', $2, $3)`,
      [tenantId, `attachments-${tenantId}`, schemaName],
    );
  });

  afterAll(async () => {
    if (!dataSource.isInitialized) return;
    await dataSource.query(`DELETE FROM public.tenancies WHERE id = $1::uuid`, [
      tenantId,
    ]);
    await dataSource.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
    await dataSource.destroy();
  });

  it('creates the tenant attachments table with original_name', async () => {
    const migration = new Attachments1781600000000();
    const queryRunner = dataSource.createQueryRunner();
    await migration.up(queryRunner);

    const columns = (await queryRunner.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = $1 AND table_name = 'attachments'
       ORDER BY ordinal_position`,
      [schemaName],
    )) as { column_name: string }[];
    expect(columns.map(({ column_name }) => column_name)).toEqual([
      'id',
      'file_url',
      'original_name',
      'entity_type',
      'entity_id',
      'created_by',
      'updated_by',
      'created_at',
      'updated_at',
    ]);

    await migration.down(queryRunner);
    const tables = (await queryRunner.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = $1 AND table_name = 'attachments'`,
      [schemaName],
    )) as { table_name: string }[];
    expect(tables).toEqual([]);
    await queryRunner.release();
  });
});
