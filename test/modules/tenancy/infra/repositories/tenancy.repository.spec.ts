import { DataSource } from 'typeorm';
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
      await dataSource.query(`DROP SCHEMA IF EXISTS "${tenancy.schemaName}" CASCADE`);
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

    expect(result.getOrThrow().id).toBe(tenancy.id);
    expect(schema[0].exists).toBe(true);
    expect(
      await dataSource.getRepository(TenancyModel).findOne({ where: { id: tenancy.id } }),
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
      await dataSource.getRepository(TenancyModel).findOne({ where: { id: tenancy.id } }),
    ).toBeNull();
  });
});
