import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import UserEntity from '@/modules/users/domain/entities/user.entity';
import UserModel from '@/modules/users/infra/models/user.model';
import UserRepository from '@/modules/users/infra/repositories/user.repository';
import { validUser } from '@test/constants/users/domain/entities/user.constants';

describe('UserRepository', () => {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    entities: [UserModel],
  });
  const tenantIds: string[] = [];
  const userIds: string[] = [];

  beforeAll(async () => {
    await dataSource.initialize();
  });

  afterEach(async () => {
    const idsToDelete = userIds.splice(0);
    if (idsToDelete.length > 0) {
      await dataSource.getRepository(UserModel).delete(idsToDelete);
    }

    const tenantsToDelete = tenantIds.splice(0);
    if (tenantsToDelete.length > 0) {
      await dataSource.query('DELETE FROM public.tenancies WHERE id = ANY($1::uuid[])', [
        tenantsToDelete,
      ]);
    }
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('isolates users with the same email by tenant', async () => {
    const firstTenantId = await createTenant(dataSource, tenantIds, 'first');
    const secondTenantId = await createTenant(dataSource, tenantIds, 'second');
    const repository = new UserRepository(dataSource.getRepository(UserModel));
    const email = 'shared@example.com';

    const firstUser = UserEntity.createUser({ ...validUser, email }, firstTenantId);
    const secondUser = UserEntity.createUser({ ...validUser, email }, secondTenantId);
    userIds.push(firstUser.id, secondUser.id);

    expect((await repository.save(firstUser)).isRight()).toBe(true);
    expect((await repository.save(secondUser)).isRight()).toBe(true);
    expect((await repository.findOne({ email, tenantId: firstTenantId })).getOrThrow().id).toBe(
      firstUser.id,
    );
    expect((await repository.findOne({ email, tenantId: secondTenantId })).getOrThrow().id).toBe(
      secondUser.id,
    );
  });

  it('returns a concrete not-found exception within the tenant scope', async () => {
    const repository = new UserRepository(dataSource.getRepository(UserModel));
    const result = await repository.findOne({
      email: 'missing@example.com',
      tenantId: randomUUID(),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) {
      throw new Error('Expected a repository failure');
    }
    expect(result.value.code).toBe(ErrorCodeConstants.USER_NOT_FOUND);
  });
});

async function createTenant(
  dataSource: DataSource,
  tenantIds: string[],
  suffix: string,
): Promise<string> {
  const id = randomUUID();
  tenantIds.push(id);
  await dataSource.query(
    `INSERT INTO public.tenancies (id, name, slug, cnpj, active, schema_name)
     VALUES ($1, $2, $3, NULL, TRUE, $4)`,
    [id, `Tenant ${suffix}`, `tenant-${suffix}-${id.slice(0, 8)}`, `tenant_${id.replaceAll('-', '')}`],
  );
  return id;
}
