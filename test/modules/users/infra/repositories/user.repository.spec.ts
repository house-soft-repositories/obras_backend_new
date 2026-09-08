import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import TenancyModel from '@/modules/tenancy/infra/models/tenancy.model';
import TenantContext from '@/core/multitenancy/tenant_context';
import TenantIdentitySchema from '@/core/multitenancy/tenant_identity_schema';
import TenantSchemaResolver from '@/core/multitenancy/tenant_schema_resolver';
import LocalidadeEntity from '@/modules/localidades/domain/entities/localidade.entity';
import { TipoLocalidade } from '@/modules/localidades/domain/enums/tipo_localidade.enum';
import LocalidadeRepository from '@/modules/localidades/infra/repositories/localidade.repository';
import OrgaoEntity from '@/modules/orgaos/domain/entities/orgao.entity';
import SetorEntity from '@/modules/orgaos/domain/entities/setor.entity';
import { TipoOrgao } from '@/modules/orgaos/domain/enums/tipo_orgao.enum';
import OrgaoRepository from '@/modules/orgaos/infra/repositories/orgao.repository';
import SetorRepository from '@/modules/orgaos/infra/repositories/setor.repository';
import UserEntity from '@/modules/users/domain/entities/user.entity';
import UserModel from '@/modules/users/infra/models/user.model';
import UserRepository from '@/modules/users/infra/repositories/user.repository';
import { validOrgao, validSetor } from '@test/constants/orgaos/domain/entities/orgao_setor.constants';
import { validUser } from '@test/constants/users/domain/entities/user.constants';
import { right } from '@/core/types/either';

describe('UserRepository', () => {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    entities: [TenancyModel, UserModel],
  });
  const tenantIds: string[] = [];
  const userIds: string[] = [];
  const schemas: string[] = [];

  beforeAll(async () => {
    await dataSource.initialize();
  });

  afterEach(async () => {
    for (const schemaName of schemas.splice(0)) {
      await dataSource.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
    }

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
    const repository = new UserRepository(
      dataSource.getRepository(UserModel),
      dataSource,
      new TenantSchemaResolver(dataSource),
    );
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

  it('lists only users from the requested tenant ordered by name', async () => {
    const firstTenantId = await createTenant(dataSource, tenantIds, 'list-first');
    const secondTenantId = await createTenant(dataSource, tenantIds, 'list-second');
    const repository = new UserRepository(
      dataSource.getRepository(UserModel),
      dataSource,
      new TenantSchemaResolver(dataSource),
    );
    const bruno = UserEntity.createUser(
      { ...validUser, name: 'Bruno', email: 'bruno@example.com' },
      firstTenantId,
    );
    const ana = UserEntity.createStaff(
      { ...validUser, name: 'Ana', email: 'ana@example.com' },
      firstTenantId,
    );
    const foreign = UserEntity.createUser(
      { ...validUser, name: 'Caio', email: 'caio@example.com' },
      secondTenantId,
    );
    userIds.push(bruno.id, ana.id, foreign.id);

    expect((await repository.save(bruno)).isRight()).toBe(true);
    expect((await repository.save(ana)).isRight()).toBe(true);
    expect((await repository.save(foreign)).isRight()).toBe(true);

    const result = await repository.listByTenantId(firstTenantId);

    expect(result.isRight()).toBe(true);
    expect(result.getOrThrow().map((user) => user.name)).toEqual([
      'Ana',
      'Bruno',
    ]);
    expect(result.getOrThrow().map((user) => user.tenantId)).toEqual([
      firstTenantId,
      firstTenantId,
    ]);
  });

  it('returns a concrete not-found exception within the tenant scope', async () => {
    const repository = new UserRepository(
      dataSource.getRepository(UserModel),
      dataSource,
      new TenantSchemaResolver(dataSource),
    );
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

  it('resolves verified locality, organization and sector references by tenant', async () => {
    const tenancy = await createTenantSchema(dataSource, tenantIds, schemas, 'verified');
    const context = new TenantContext();
    const repositories = repositoriesFor(dataSource, context);

    const result = await context.run(
      { tenantId: tenancy.id, schemaName: tenancy.schemaName },
      async () => {
        const localidade = await repositories.localidades.save(
          LocalidadeEntity.create(localidadeProps('Fortaleza')),
        );
        const orgao = await repositories.orgaos.save(
          OrgaoEntity.create(
            orgaoProps(localidade.getOrThrow().id, validOrgao.nome),
          ),
        );
        const setor = await repositories.setores.save(
          SetorEntity.create(setorProps(orgao.getOrThrow().id, validSetor.nome)),
        );

        const localidadeResult = await repositories.user.existsLocalidade(
          localidade.getOrThrow().id,
          tenancy.id,
        );
        const orgaoResult = await repositories.user.existsOrgao(
          orgao.getOrThrow().id,
          tenancy.id,
        );
        const setorResult = await repositories.user.findSetorById(
          setor.getOrThrow().id,
          tenancy.id,
        );

        return {
          localidadeResult,
          orgaoResult,
          setorResult,
          orgaoId: orgao.getOrThrow().id,
        };
      },
    );

    expect(result.localidadeResult).toEqual(right(true));
    expect(result.orgaoResult).toEqual(right(true));
    expect(result.setorResult).toEqual(
      right({ id: expect.any(String), orgaoId: result.orgaoId }),
    );
  });
});

function repositoriesFor(dataSource: DataSource, context: TenantContext) {
  return {
    user: new UserRepository(
      dataSource.getRepository(UserModel),
      dataSource,
      new TenantSchemaResolver(dataSource),
    ),
    localidades: new LocalidadeRepository(dataSource, context),
    orgaos: new OrgaoRepository(dataSource, context),
    setores: new SetorRepository(dataSource, context),
  };
}

function localidadeProps(nome: string) {
  return {
    nome,
    uf: 'ce',
    codigoIbge: null,
    tipo: TipoLocalidade.BAIRRO,
    municipio: 'Fortaleza',
    observacoes: null,
  };
}

function orgaoProps(localidadeId: string, nome: string) {
  return {
    localidadeId,
    nome,
    sigla: null,
    tipo: TipoOrgao.SECRETARIA,
    responsavel: null,
    email: null,
    telefone: null,
  };
}

function setorProps(orgaoId: string, nome: string) {
  return { orgaoId, nome, ativo: true };
}

async function createTenantSchema(
  dataSource: DataSource,
  tenantIds: string[],
  schemas: string[],
  suffix: string,
): Promise<{ id: string; schemaName: string }> {
  const id = randomUUID();
  tenantIds.push(id);
  const schemaName = `tenant_${id.replaceAll('-', '')}`;
  schemas.push(schemaName);
  await dataSource.query(
    `INSERT INTO public.tenancies (id, name, slug, cnpj, active, schema_name)
     VALUES ($1, $2, $3, NULL, TRUE, $4)`,
    [id, `Tenant ${suffix}`, `tenant-${suffix}-${id.slice(0, 8)}`, schemaName],
  );
  await dataSource.query(`CREATE SCHEMA "${schemaName}"`);
  await TenantIdentitySchema.create(dataSource, schemaName);
  return { id, schemaName };
}

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
