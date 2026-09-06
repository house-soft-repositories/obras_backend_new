import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import TenantContext from '@/core/multitenancy/tenant_context';
import TenantIdentitySchema from '@/core/multitenancy/tenant_identity_schema';
import LocalidadeEntity from '@/modules/localidades/domain/entities/localidade.entity';
import { TipoLocalidade } from '@/modules/localidades/domain/enums/tipo_localidade.enum';
import LocalidadeRepository from '@/modules/localidades/infra/repositories/localidade.repository';
import { validLocalidade } from '@test/constants/localidades/domain/entities/localidade.constants';

describe('LocalidadeRepository', () => {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  });
  const schemas: string[] = [];
  const context = new TenantContext();

  beforeAll(async () => {
    await dataSource.initialize();
  });

  afterEach(async () => {
    for (const schemaName of schemas.splice(0)) {
      await dataSource.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
    }
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('persists localities in the verified schema and lists them by name', async () => {
    const tenancy = await createTenantSchema(dataSource, schemas);
    const repository = new LocalidadeRepository(dataSource, context);
    const zeta = LocalidadeEntity.create(localidade('Zeta'));
    const alpha = LocalidadeEntity.create(localidade('Alpha'));

    const result = await context.run(tenantContext(tenancy), async () => {
      await repository.save(zeta);
      await repository.save(alpha);
      return repository.findAll();
    });

    expect(result.getOrThrow().map((item) => item.nome)).toEqual(['Alpha', 'Zeta']);
    expect(result.getOrThrow()[0]).toMatchObject({
      uf: 'PI',
      tipo: TipoLocalidade.BAIRRO,
      municipio: 'Teresina',
    });
  });

  it('updates only the persisted record in its verified schema', async () => {
    const tenancy = await createTenantSchema(dataSource, schemas);
    const repository = new LocalidadeRepository(dataSource, context);
    const created = LocalidadeEntity.create(localidade('Centro'));
    const updated = LocalidadeEntity.fromData({
      ...created.toObject(),
      municipio: 'Parnaíba',
      updatedAt: new Date('2026-09-04T12:00:00.000Z'),
    });

    const result = await context.run(tenantContext(tenancy), async () => {
      await repository.save(created);
      return repository.save(updated);
    });

    expect(result.getOrThrow()).toMatchObject({
      id: created.id,
      nome: 'Centro',
      municipio: 'Parnaíba',
      updatedAt: new Date('2026-09-04T12:00:00.000Z'),
    });
  });

  it('does not expose a locality belonging to another tenant schema', async () => {
    const first = await createTenantSchema(dataSource, schemas);
    const second = await createTenantSchema(dataSource, schemas);
    const repository = new LocalidadeRepository(dataSource, context);
    const foreign = LocalidadeEntity.create(localidade('Foreign'));

    await context.run(tenantContext(second), () => repository.save(foreign));
    const result = await context.run(tenantContext(first), () => repository.findById(foreign.id));

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected a not-found failure');
    expect(result.value.code).toBe(ErrorCodeConstants.LOCALIDADE_NOT_FOUND);
  });

  it('lists only localities belonging to the verified tenant schema', async () => {
    const first = await createTenantSchema(dataSource, schemas);
    const second = await createTenantSchema(dataSource, schemas);
    const repository = new LocalidadeRepository(dataSource, context);

    await context.run(tenantContext(first), () =>
      repository.save(LocalidadeEntity.create(localidade('Tenant One'))),
    );
    await context.run(tenantContext(second), () =>
      repository.save(LocalidadeEntity.create(localidade('Tenant Two'))),
    );

    const result = await context.run(tenantContext(first), () =>
      repository.findAll(),
    );

    expect(result.getOrThrow().map((item) => item.nome)).toEqual(['Tenant One']);
  });
});

function localidade(nome: string) {
  return {
    nome,
    uf: validLocalidade.uf.toLowerCase(),
    codigoIbge: validLocalidade.codigoIbge,
    tipo: validLocalidade.tipo,
    municipio: validLocalidade.municipio,
    observacoes: validLocalidade.observacoes,
  };
}

function tenantContext(tenancy: { id: string; schemaName: string }) {
  return { tenantId: tenancy.id, schemaName: tenancy.schemaName };
}

async function createTenantSchema(
  dataSource: DataSource,
  schemas: string[],
): Promise<{ id: string; schemaName: string }> {
  const id = randomUUID();
  const schemaName = `tenant_${id.replaceAll('-', '')}`;
  schemas.push(schemaName);
  await dataSource.query(`CREATE SCHEMA "${schemaName}"`);
  await TenantIdentitySchema.create(dataSource, schemaName);
  return { id, schemaName };
}
