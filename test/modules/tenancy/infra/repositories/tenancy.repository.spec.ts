import { DataSource } from 'typeorm';
import TenantIdentitySchema from '@/core/multitenancy/tenant_identity_schema';
import TenancyEntity from '@/modules/tenancy/domain/entities/tenancy.entity';
import TenancyModel from '@/modules/tenancy/infra/models/tenancy.model';
import TenancyRepository from '@/modules/tenancy/infra/repositories/tenancy.repository';
import { validTenancy } from '@test/constants/tenancy/domain/entities/tenancy.constants';

describe('TenancyRepository', () => {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    entities: [TenancyModel],
  });
  const createdTenancies: TenancyEntity[] = [];

  beforeAll(async () => {
    await dataSource.initialize();
  });

  afterEach(async () => {
    for (const tenancy of createdTenancies.splice(0)) {
      await dataSource.query(
        `DROP SCHEMA IF EXISTS "${tenancy.schemaName}" CASCADE`,
      );
      await dataSource.getRepository(TenancyModel).delete(tenancy.id);
    }
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('creates the generated tenant schema and persists the tenancy', async () => {
    const tenancy = TenancyEntity.create(validTenancy);
    createdTenancies.push(tenancy);
    const repository = new TenancyRepository(dataSource);

    const result = await repository.provision(tenancy);
    const schema = await dataSource.query<{ exists: boolean }[]>(
      `SELECT EXISTS(SELECT 1 FROM pg_namespace WHERE nspname = $1) AS "exists"`,
      [tenancy.schemaName],
    );
    const identityTables = await dataSource.query<{ table_name: string }[]>(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = $1
         AND table_name IN ('localidades', 'orgaos', 'setores', 'obras')`,
      [tenancy.schemaName],
    );

    expect(result.getOrThrow().id).toBe(tenancy.id);
    expect(schema[0].exists).toBe(true);
    expect(identityTables.map(({ table_name }) => table_name).sort()).toEqual([
      'localidades',
      'orgaos',
      'setores',
    ]);
    expect(
      await dataSource
        .getRepository(TenancyModel)
        .findOne({ where: { id: tenancy.id } }),
    ).toBeDefined();
  });

  it('rolls back persistence when the schema cannot be created', async () => {
    const tenancy = TenancyEntity.create({
      ...validTenancy,
      slug: 'schema-existing',
    });
    await dataSource.query(`CREATE SCHEMA "${tenancy.schemaName}"`);
    createdTenancies.push(tenancy);
    const repository = new TenancyRepository(dataSource);

    const result = await repository.provision(tenancy);

    expect(result.isLeft()).toBe(true);
    expect(
      await dataSource
        .getRepository(TenancyModel)
        .findOne({ where: { id: tenancy.id } }),
    ).toBeNull();
  });

  it('rolls back a generated schema when tenancy persistence rejects a duplicate slug', async () => {
    const persistedTenancy = TenancyEntity.create(validTenancy);
    const duplicateSlugTenancy = TenancyEntity.create(validTenancy);
    createdTenancies.push(persistedTenancy);
    const repository = new TenancyRepository(dataSource);
    await repository.provision(persistedTenancy);

    const result = await repository.provision(duplicateSlugTenancy);
    const schema = await dataSource.query<{ exists: boolean }[]>(
      `SELECT EXISTS(SELECT 1 FROM pg_namespace WHERE nspname = $1) AS "exists"`,
      [duplicateSlugTenancy.schemaName],
    );

    expect(result.isLeft()).toBe(true);
    expect(schema[0].exists).toBe(false);
  });

  it('rolls back a generated schema when tenancy persistence itself fails', async () => {
    const tenancy = TenancyEntity.create(validTenancy);
    const repository = new TenancyRepository(dataSource);
    await dataSource.query(`
      CREATE FUNCTION public.fail_tenancy_provision() RETURNS trigger AS $$
      BEGIN
        RAISE EXCEPTION 'test persistence failure';
      END;
      $$ LANGUAGE plpgsql;
      CREATE TRIGGER fail_tenancy_provision
      BEFORE INSERT ON public.tenancies
      FOR EACH ROW EXECUTE FUNCTION public.fail_tenancy_provision();
    `);

    try {
      const result = await repository.provision(tenancy);
      const schema = await dataSource.query<{ exists: boolean }[]>(
        `SELECT EXISTS(SELECT 1 FROM pg_namespace WHERE nspname = $1) AS "exists"`,
        [tenancy.schemaName],
      );

      expect(result.isLeft()).toBe(true);
      expect(schema[0].exists).toBe(false);
    } finally {
      await dataSource.query(
        `DROP TRIGGER fail_tenancy_provision ON public.tenancies`,
      );
      await dataSource.query(`DROP FUNCTION public.fail_tenancy_provision()`);
    }
  });

  it('rolls back schema and tenancy when identity table bootstrap fails', async () => {
    const tenancy = TenancyEntity.create({
      ...validTenancy,
      slug: 'locality-bootstrap-fails',
    });
    const repository = new TenancyRepository(dataSource);
    const createSpy = jest
      .spyOn(TenantIdentitySchema, 'create')
      .mockRejectedValueOnce(new Error('localidades bootstrap failed'));

    try {
      const result = await repository.provision(tenancy);
      const schema = await dataSource.query<{ exists: boolean }[]>(
        `SELECT EXISTS(SELECT 1 FROM pg_namespace WHERE nspname = $1) AS "exists"`,
        [tenancy.schemaName],
      );

      expect(result.isLeft()).toBe(true);
      expect(schema[0].exists).toBe(false);
      expect(
        await dataSource
          .getRepository(TenancyModel)
          .findOne({ where: { id: tenancy.id } }),
      ).toBeNull();
    } finally {
      createSpy.mockRestore();
    }
  });
});
