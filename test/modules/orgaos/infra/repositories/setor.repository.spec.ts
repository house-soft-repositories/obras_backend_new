import { randomUUID } from 'node:crypto';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import TenantContext from '@/core/multitenancy/tenant_context';
import TenantIdentitySchema from '@/core/multitenancy/tenant_identity_schema';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import LocalidadeEntity from '@/modules/localidades/domain/entities/localidade.entity';
import { TipoLocalidade } from '@/modules/localidades/domain/enums/tipo_localidade.enum';
import LocalidadeRepository from '@/modules/localidades/infra/repositories/localidade.repository';
import OrgaoEntity from '@/modules/orgaos/domain/entities/orgao.entity';
import { DataSource } from 'typeorm';
import SetorEntity from '@/modules/orgaos/domain/entities/setor.entity';
import OrgaoRepository from '@/modules/orgaos/infra/repositories/orgao.repository';
import SetorRepository from '@/modules/orgaos/infra/repositories/setor.repository';
import {
  orgaoIds,
  validOrgao,
  validSetor,
} from '@test/constants/orgaos/domain/entities/orgao_setor.constants';

describe('SetorRepository', () => {
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

  it('persists sectors under a verified organization and lists them by name', async () => {
    const tenancy = await createTenantSchema(dataSource, schemas);
    const repositories = repositoriesFor(context, dataSource);

    let createdOrgaoId = '';
    const result = await context.run(tenantContext(tenancy), async () => {
      const localidade = await repositories.localidades.save(
        LocalidadeEntity.create(localidadeProps('Fortaleza')),
      );
      const orgao = await repositories.orgaos.save(
        OrgaoEntity.create(
          orgaoProps(localidade.getOrThrow().id, 'Secretaria'),
        ),
      );
      createdOrgaoId = orgao.getOrThrow().id;
      await repositories.setores.save(
        SetorEntity.create(setorProps(createdOrgaoId, 'Zeladoria')),
      );
      await repositories.setores.save(
        SetorEntity.create(setorProps(createdOrgaoId, 'Arquitetura')),
      );

      return repositories.setores.findAllByOrgao(
        new PageOptionsEntity('ASC', 1, 10),
      );
    });

    const page = result.getOrThrow();
    expect(page.pageData.map((item) => item.nome)).toEqual([
      'Arquitetura',
      'Zeladoria',
    ]);
    expect(page.pageData[0]).toMatchObject({
      ativo: true,
      orgao: { id: createdOrgaoId, nome: 'Secretaria' },
    });
    expect(page.pageMeta.itemCount).toBe(2);
  });

  it('maps missing organization references to not found in the verified schema', async () => {
    const tenancy = await createTenantSchema(dataSource, schemas);
    const repositories = repositoriesFor(context, dataSource);
    const setor = SetorEntity.create(setorProps(orgaoIds.orgaoId, 'Projetos'));

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
