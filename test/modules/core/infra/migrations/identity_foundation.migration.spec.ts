import { randomUUID } from 'node:crypto';
import { DataSource, DataSourceOptions } from 'typeorm';
import { CreateIdentityFoundation1781200000000 } from '@/core/database/migrations/1781200000000-create_identity_foundation';

describe('CreateIdentityFoundation1781200000000', () => {
  const databaseName = `identity_migration_${randomUUID().replaceAll('-', '')}`;
  const connectionOptions: DataSourceOptions = {
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  };
  const adminDataSource = new DataSource(connectionOptions);
  let migrationDataSource: DataSource;

  beforeAll(async () => {
    await adminDataSource.initialize();
    await adminDataSource.query(`CREATE DATABASE "${databaseName}"`);
    migrationDataSource = new DataSource({
      ...connectionOptions,
      database: databaseName,
    });
    await migrationDataSource.initialize();
  });

  afterAll(async () => {
    if (migrationDataSource?.isInitialized) await migrationDataSource.destroy();
    if (adminDataSource.isInitialized) {
      await adminDataSource.query(
        `DROP DATABASE IF EXISTS "${databaseName}" WITH (FORCE)`,
      );
      await adminDataSource.destroy();
    }
  });

  it('creates the public identity schema with its required constraints', async () => {
    const migration = new CreateIdentityFoundation1781200000000();
    const queryRunner = migrationDataSource.createQueryRunner();
    await migration.up(queryRunner);

    const tables = (await queryRunner.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name IN ('tenancies', 'users', 'user_sessions')`,
    )) as unknown as { table_name: string }[];
    const columns = (await queryRunner.query(
      `SELECT table_name, column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name IN ('tenancies', 'users', 'user_sessions')`,
    )) as unknown as {
      table_name: string;
      column_name: string;
      data_type: string;
      is_nullable: 'YES' | 'NO';
    }[];
    const constraints = (await queryRunner.query(
      `SELECT conrelid::regclass::text AS table_name, conname AS constraint_name, contype AS constraint_type
       FROM pg_constraint
       WHERE connamespace = 'public'::regnamespace
         AND conname = ANY($1::text[])`,
      [
        [
          'PK_tenancies',
          'UQ_tenancies_slug',
          'UQ_tenancies_schema_name',
          'PK_users',
          'FK_users_tenancies',
          'CHK_users_role_tenant',
          'PK_user_sessions',
          'FK_user_sessions_users',
        ],
      ],
    )) as unknown as {
      table_name: string;
      constraint_name: string;
      constraint_type: string;
    }[];
    const indexes = (await queryRunner.query(
      `SELECT indexname, indexdef
       FROM pg_indexes
       WHERE schemaname = 'public'
         AND indexname IN ('UQ_users_tenant_email', 'UQ_users_platform_email')`,
    )) as unknown as { indexname: string; indexdef: string }[];

    expect(tables.map(({ table_name }) => table_name).sort()).toEqual([
      'tenancies',
      'user_sessions',
      'users',
    ]);
    expect(columns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          table_name: 'tenancies',
          column_name: 'id',
          data_type: 'uuid',
          is_nullable: 'NO',
        }),
        expect.objectContaining({
          table_name: 'tenancies',
          column_name: 'schema_name',
          is_nullable: 'NO',
        }),
        expect.objectContaining({
          table_name: 'users',
          column_name: 'tenant_id',
          data_type: 'uuid',
          is_nullable: 'YES',
        }),
        expect.objectContaining({
          table_name: 'user_sessions',
          column_name: 'refresh_token_hash',
          is_nullable: 'NO',
        }),
        expect.objectContaining({
          table_name: 'user_sessions',
          column_name: 'expires_at',
          is_nullable: 'NO',
        }),
        expect.objectContaining({
          table_name: 'user_sessions',
          column_name: 'revoked_at',
          is_nullable: 'YES',
        }),
      ]),
    );
    expect(
      columns
        .filter(({ table_name }) => table_name === 'user_sessions')
        .map(({ column_name }) => column_name)
        .sort(),
    ).toEqual([
      'created_at',
      'expires_at',
      'id',
      'refresh_token_hash',
      'revoked_at',
      'updated_at',
      'user_id',
    ]);
    expect(
      columns
        .filter(({ table_name }) => table_name === 'tenancies')
        .map(({ column_name }) => column_name)
        .sort(),
    ).toEqual([
      'active',
      'cnpj',
      'created_at',
      'id',
      'name',
      'schema_name',
      'slug',
      'updated_at',
    ]);
    expect(
      columns
        .filter(({ table_name }) => table_name === 'users')
        .map(({ column_name }) => column_name)
        .sort(),
    ).toEqual([
      'created_at',
      'email',
      'id',
      'name',
      'password',
      'role',
      'tenant_id',
      'updated_at',
    ]);
    expect(constraints).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          table_name: 'tenancies',
          constraint_name: 'PK_tenancies',
          constraint_type: 'p',
        }),
        expect.objectContaining({
          table_name: 'tenancies',
          constraint_name: 'UQ_tenancies_slug',
          constraint_type: 'u',
        }),
        expect.objectContaining({
          table_name: 'tenancies',
          constraint_name: 'UQ_tenancies_schema_name',
          constraint_type: 'u',
        }),
        expect.objectContaining({
          table_name: 'users',
          constraint_name: 'FK_users_tenancies',
          constraint_type: 'f',
        }),
        expect.objectContaining({
          table_name: 'users',
          constraint_name: 'CHK_users_role_tenant',
          constraint_type: 'c',
        }),
        expect.objectContaining({
          table_name: 'user_sessions',
          constraint_name: 'FK_user_sessions_users',
          constraint_type: 'f',
        }),
      ]),
    );
    expect(indexes.map(({ indexname }) => indexname).sort()).toEqual([
      'UQ_users_platform_email',
      'UQ_users_tenant_email',
    ]);
    expect(
      indexes.find(({ indexname }) => indexname === 'UQ_users_platform_email')
        ?.indexdef,
    ).toContain('WHERE (tenant_id IS NULL)');

    await expect(
      queryRunner.query(
        `INSERT INTO public.users (id, name, email, password, role, tenant_id)
       VALUES ($1, 'Superadmin', 'admin@example.com', 'hash', 'SUPERADMIN', $2)`,
        [randomUUID(), randomUUID()],
      ),
    ).rejects.toMatchObject({ code: '23514' });

    await expect(
      queryRunner.query(
        `INSERT INTO public.users (id, name, email, password, role, tenant_id)
       VALUES ($1, 'User', 'user@example.com', 'hash', 'USER', NULL)`,
        [randomUUID()],
      ),
    ).rejects.toMatchObject({ code: '23514' });

    const firstTenantId = randomUUID();
    const secondTenantId = randomUUID();
    await queryRunner.query(
      `INSERT INTO public.tenancies (id, name, slug, schema_name)
       VALUES ($1, 'First Tenant', 'first-tenant', 'tenant_first'),
               ($2, 'Second Tenant', 'second-tenant', 'tenant_second')`,
      [firstTenantId, secondTenantId],
    );
    await queryRunner.query(
      `INSERT INTO public.users (id, name, email, password, role, tenant_id)
       VALUES ($1, 'First User', 'shared@example.com', 'hash', 'USER', $2)`,
      [randomUUID(), firstTenantId],
    );
    await expect(
      queryRunner.query(
        `INSERT INTO public.users (id, name, email, password, role, tenant_id)
       VALUES ($1, 'Duplicate User', 'shared@example.com', 'hash', 'USER', $2)`,
        [randomUUID(), firstTenantId],
      ),
    ).rejects.toMatchObject({ code: '23505' });
    await expect(
      queryRunner.query(
        `INSERT INTO public.users (id, name, email, password, role, tenant_id)
       VALUES ($1, 'Second User', 'shared@example.com', 'hash', 'USER', $2)`,
        [randomUUID(), secondTenantId],
      ),
    ).resolves.toBeDefined();
    await queryRunner.query(
      `INSERT INTO public.users (id, name, email, password, role, tenant_id)
       VALUES ($1, 'Platform User', 'platform@example.com', 'hash', 'SUPERADMIN', NULL)`,
      [randomUUID()],
    );
    await expect(
      queryRunner.query(
        `INSERT INTO public.users (id, name, email, password, role, tenant_id)
       VALUES ($1, 'Duplicate Platform User', 'platform@example.com', 'hash', 'SUPERADMIN', NULL)`,
        [randomUUID()],
      ),
    ).rejects.toMatchObject({ code: '23505' });
    await expect(
      queryRunner.query(
        `INSERT INTO public.users (id, name, email, password, role, tenant_id)
       VALUES ($1, 'Missing Tenant User', 'missing@example.com', 'hash', 'USER', $2)`,
        [randomUUID(), randomUUID()],
      ),
    ).rejects.toMatchObject({ code: '23503' });

    await migration.down(queryRunner);
    await queryRunner.release();

    const remainingTables = (await migrationDataSource.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name IN ('tenancies', 'users', 'user_sessions')`,
    )) as unknown as { table_name: string }[];
    expect(remainingTables).toHaveLength(0);
  });
});
