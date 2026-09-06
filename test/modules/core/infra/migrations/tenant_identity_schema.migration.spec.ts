import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import { CreateTenantIdentitySchema1781300000000 } from '@/core/database/migrations/1781300000000-create_tenant_identity_schema';

describe('CreateTenantIdentitySchema1781300000000', () => {
  const tenantId = randomUUID();
  const secondTenantId = randomUUID();
  const schemaName = `tenant_${tenantId.replaceAll('-', '')}`;
  const secondSchemaName = `tenant_${secondTenantId.replaceAll('-', '')}`;
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
    await dataSource.query(`CREATE SCHEMA "${secondSchemaName}"`);
    await dataSource.query(
      `INSERT INTO public.tenancies (id, name, slug, schema_name)
       VALUES ($1, 'Existing Tenant', $2, $3),
              ($4, 'Second Existing Tenant', $5, $6)`,
      [
        tenantId,
        `existing-${tenantId}`,
        schemaName,
        secondTenantId,
        `existing-${secondTenantId}`,
        secondSchemaName,
      ],
    );
  });

  afterAll(async () => {
    if (!dataSource.isInitialized) return;
    await dataSource.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
    await dataSource.query(`DROP SCHEMA IF EXISTS "${secondSchemaName}" CASCADE`);
    await dataSource.query(
      `DELETE FROM public.tenancies WHERE id = ANY($1::uuid[])`,
      [[tenantId, secondTenantId]],
    );
    await dataSource.destroy();
  });

  it('creates the identity tables for an existing tenant without deleting data', async () => {
    const migration = new CreateTenantIdentitySchema1781300000000();
    const queryRunner = dataSource.createQueryRunner();
    await migration.up(queryRunner);

    const tables = (await queryRunner.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = $1
         AND table_name IN ('localidades', 'orgaos', 'setores', 'obras')`,
      [schemaName],
    )) as { table_name: string }[];
    expect(tables.map(({ table_name }) => table_name).sort()).toEqual([
      'localidades',
      'orgaos',
      'setores',
    ]);
    const secondTables = (await queryRunner.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = $1
         AND table_name IN ('localidades', 'orgaos', 'setores', 'obras')`,
      [secondSchemaName],
    )) as { table_name: string }[];
    expect(secondTables.map(({ table_name }) => table_name).sort()).toEqual([
      'localidades',
      'orgaos',
      'setores',
    ]);

    const localityId = randomUUID();
    await queryRunner.query(
      `INSERT INTO "${schemaName}"."localidades" (id, nome, uf)
       VALUES ($1, 'Centro', 'PI')`,
      [localityId],
    );
    await migration.up(queryRunner);
    const localities = (await queryRunner.query(
      `SELECT id FROM "${schemaName}"."localidades" WHERE id = $1`,
      [localityId],
    )) as { id: string }[];
    expect(localities).toEqual([{ id: localityId }]);

    await queryRunner.release();
  });
});
