import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import TenantContext from '@/core/multitenancy/tenant_context';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import TenantIdentitySchema from '@/core/multitenancy/tenant_identity_schema';
import LocalidadeEntity from '@/modules/localidades/domain/entities/localidade.entity';
import { TipoLocalidade } from '@/modules/localidades/domain/enums/tipo_localidade.enum';
import LocalidadeRepository from '@/modules/localidades/infra/repositories/localidade.repository';
import OrgaoEntity from '@/modules/orgaos/domain/entities/orgao.entity';
import SetorEntity from '@/modules/orgaos/domain/entities/setor.entity';
import { TipoOrgao } from '@/modules/orgaos/domain/enums/tipo_orgao.enum';
import OrgaoRepository from '@/modules/orgaos/infra/repositories/orgao.repository';
import SetorRepository from '@/modules/orgaos/infra/repositories/setor.repository';
import {
  orgaoIds,
  validOrgao,
  validSetor,
} from '@test/constants/orgaos/domain/entities/orgao_setor.constants';

describe('OrgaoRepository and SetorRepository', () => {
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

  it('persists organizations in the verified schema and lists them by name', async () => {
    const tenancy = await createTenantSchema(dataSource, schemas);
    const repositories = repositoriesFor(context, dataSource);

    const result = await context.run(tenantContext(tenancy), async () => {
      const localidade = await repositories.localidades.save(
        LocalidadeEntity.create(localidadeProps('Fortaleza')),
      );
      const zeta = OrgaoEntity.create(orgaoProps(localidade.getOrThrow().id, 'Zeta'));
      const alpha = OrgaoEntity.create(
        orgaoProps(localidade.getOrThrow().id, 'Alpha'),
      );

      await repositories.orgaos.save(zeta);
      await repositories.orgaos.save(alpha);
      return repositories.orgaos.findAll(new PageOptionsEntity('ASC', 1, 10));
    });

    const page = result.getOrThrow();
    expect(page.pageData.map((item) => item.nome)).toEqual([
      'Alpha',
      'Zeta',
    ]);
    expect(page.pageData[0]).toMatchObject({
      tipo: TipoOrgao.SECRETARIA,
      ativo: true,
    });
  });

  it('maps missing locality references to not found in the verified schema', async () => {
    const tenancy = await createTenantSchema(dataSource, schemas);
    const repositories = repositoriesFor(context, dataSource);
    const orgao = OrgaoEntity.create(
      orgaoProps(orgaoIds.localidadeId, 'Secretaria'),
    );

    const result = await context.run(tenantContext(tenancy), () =>
      repositories.orgaos.save(orgao),
    );

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected not-found failure');
    expect(result.value).toMatchObject({
      code: ErrorCodeConstants.LOCALIDADE_NOT_FOUND,
      statusCode: 404,
    });
  });

  it('does not expose organizations belonging to another tenant schema', async () => {
    const first = await createTenantSchema(dataSource, schemas);
    const second = await createTenantSchema(dataSource, schemas);
    const repositories = repositoriesFor(context, dataSource);

    const foreign = await context.run(tenantContext(second), async () => {
      const localidade = await repositories.localidades.save(
        LocalidadeEntity.create(localidadeProps('Fortaleza')),
      );
      const orgao = await repositories.orgaos.save(
        OrgaoEntity.create(orgaoProps(localidade.getOrThrow().id, 'Secretaria')),
      );
      return orgao.getOrThrow();
    });

    const result = await context.run(tenantContext(first), () =>
      repositories.orgaos.findById(foreign.id),
    );

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected not-found failure');
    expect(result.value.code).toBe(ErrorCodeConstants.ORGAO_NOT_FOUND);
  });

  it('persists sectors under a verified organization and lists them by name', async () => {
    const tenancy = await createTenantSchema(dataSource, schemas);
    const repositories = repositoriesFor(context, dataSource);

    let createdOrgaoId = '';
    const result = await context.run(tenantContext(tenancy), async () => {
      const localidade = await repositories.localidades.save(
        LocalidadeEntity.create(localidadeProps('Fortaleza')),
      );
      const orgao = await repositories.orgaos.save(
        OrgaoEntity.create(orgaoProps(localidade.getOrThrow().id, 'Secretaria')),
      );
      createdOrgaoId = orgao.getOrThrow().id;
      await repositories.setores.save(
        SetorEntity.create(setorProps(createdOrgaoId, 'Zeladoria')),
      );
      await repositories.setores.save(
        SetorEntity.create(setorProps(createdOrgaoId, 'Arquitetura')),
      );

      return repositories.setores.findAllByOrgao(new PageOptionsEntity('ASC', 1, 10));
    });

    const page = result.getOrThrow();
    expect(page.pageData.map((item) => item.nome)).toEqual([
      'Arquitetura',
      'Zeladoria',
    ]);
    expect(page.pageData[0]).toMatchObject({ ativo: true, orgao: { id: createdOrgaoId, nome: 'Secretaria' } });
    expect(page.pageMeta.itemCount).toBe(2);
  });

  it('maps missing organization references to not found in the verified schema', async () => {
    const tenancy = await createTenantSchema(dataSource, schemas);
    const repositories = repositoriesFor(context, dataSource);
    const setor = SetorEntity.create(
      setorProps(orgaoIds.orgaoId, 'Projetos'),
    );

    const result = await context.run(tenantContext(tenancy), () =>
      repositories.setores.save(setor),
    );

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected not-found failure');
    expect(result.value).toMatchObject({
      code: ErrorCodeConstants.ORGAO_NOT_FOUND,
      statusCode: 404,
    });
  });
});

function repositoriesFor(context: TenantContext, dataSource: DataSource) {
  return {
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
    tipo: validOrgao.tipo,
    responsavel: null,
    email: null,
    telefone: null,
  };
}

function setorProps(orgaoId: string, nome: string) {
  return { orgaoId, nome, ativo: validSetor.ativo };
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
