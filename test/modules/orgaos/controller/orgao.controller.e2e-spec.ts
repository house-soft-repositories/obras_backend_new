import { AppModule } from '@/app.module';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import TenantContextException from '@/core/multitenancy/tenant_context.exception';
import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import { left, right } from '@/core/types/either';
import ITokenService, {
  AccessTokenPayload,
} from '@/modules/auth/adapters/token_service.interface';
import { TOKEN_SERVICE } from '@/modules/auth/symbols';
import OrgaoEntity from '@/modules/orgaos/domain/entities/orgao.entity';
import SetorEntity from '@/modules/orgaos/domain/entities/setor.entity';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageMetaEntity from '@/core/pagination/domain/entities/page_meta.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import SetorReadModel from '@/modules/orgaos/domain/read-models/setor_read_model';
import { TipoOrgao } from '@/modules/orgaos/domain/enums/tipo_orgao.enum';
import ICreateOrgaoUseCase from '@/modules/orgaos/domain/usecase/create_orgao.usecase';
import ICreateSetorUseCase from '@/modules/orgaos/domain/usecase/create_setor.usecase';
import IListOrgaosUseCase from '@/modules/orgaos/domain/usecase/list_orgaos.usecase';
import IListSetoresUseCase from '@/modules/orgaos/domain/usecase/list_setores.usecase';
import IUpdateOrgaoUseCase from '@/modules/orgaos/domain/usecase/update_orgao.usecase';
import IUpdateSetorUseCase from '@/modules/orgaos/domain/usecase/update_setor.usecase';
import OrgaoRepositoryException from '@/modules/orgaos/exceptions/orgao_repository.exception';
import OrgaoServiceException from '@/modules/orgaos/exceptions/orgao_service.exception';
import SetorRepositoryException from '@/modules/orgaos/exceptions/setor_repository.exception';
import SetorServiceException from '@/modules/orgaos/exceptions/setor_service.exception';
import {
  CREATE_ORGAO_SERVICE,
  CREATE_SETOR_SERVICE,
  LIST_ORGAOS_SERVICE,
  LIST_SETORES_SERVICE,
  UPDATE_ORGAO_SERVICE,
  UPDATE_SETOR_SERVICE,
} from '@/modules/orgaos/symbols';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import {
  orgaoIds,
  validOrgao,
  validSetor,
} from '@test/constants/orgaos/domain/entities/orgao_setor.constants';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

type MessageResponse = {
  message: string | string[];
};

type OrgaoResponse = {
  id: string;
  localidadeId: string;
  nome: string;
  tipo: TipoOrgao | null;
  ativo: boolean;
};

type SetorResponse = {
  id: string;
  nome: string;
  ativo: boolean;
  orgao: { id: string; nome: string };
};

describe('Orgaos API (e2e)', () => {
  const destinationOrgaoId = 'c10c8252-92cf-4d4b-9f20-26e9f451d23a';
  let app: INestApplication<App>;
  let tokenService: jest.Mocked<ITokenService>;
  let createOrgao: jest.Mocked<ICreateOrgaoUseCase>;
  let listOrgaos: jest.Mocked<IListOrgaosUseCase>;
  let updateOrgao: jest.Mocked<IUpdateOrgaoUseCase>;
  let createSetor: jest.Mocked<ICreateSetorUseCase>;
  let listSetores: jest.Mocked<IListSetoresUseCase>;
  let updateSetor: jest.Mocked<IUpdateSetorUseCase>;

  const tokenFor = (
    role: UserRole,
    tokenTenantId: string | null = orgaoIds.tenantId,
  ) => {
    tokenService.verifyAccess.mockResolvedValue({
      sub: orgaoIds.userId,
      type: 'access',
      role,
      tenantId: tokenTenantId,
    });
  };

  beforeEach(async () => {
    tokenService = {
      signAccess: jest.fn(),
      signRefresh: jest.fn(),
      verifyAccess: jest.fn(),
      verifyRefresh: jest.fn(),
    };
    createOrgao = { execute: jest.fn() };
    listOrgaos = { execute: jest.fn() };
    updateOrgao = { execute: jest.fn() };
    createSetor = { execute: jest.fn() };
    listSetores = { execute: jest.fn() };
    updateSetor = { execute: jest.fn() };

    const tenantRequestContext: Pick<TenantRequestContextService, 'run'> = {
      run: jest.fn(
        <T>(
          user: AccessTokenPayload | undefined,
          callback: () => Promise<T>,
        ) => {
          if (!user || user.role === UserRole.SUPERADMIN || !user.tenantId) {
            throw new TenantContextException();
          }
          return callback();
        },
      ),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(TOKEN_SERVICE)
      .useValue(tokenService)
      .overrideProvider(CREATE_ORGAO_SERVICE)
      .useValue(createOrgao)
      .overrideProvider(LIST_ORGAOS_SERVICE)
      .useValue(listOrgaos)
      .overrideProvider(UPDATE_ORGAO_SERVICE)
      .useValue(updateOrgao)
      .overrideProvider(CREATE_SETOR_SERVICE)
      .useValue(createSetor)
      .overrideProvider(LIST_SETORES_SERVICE)
      .useValue(listSetores)
      .overrideProvider(UPDATE_SETOR_SERVICE)
      .useValue(updateSetor)
      .overrideProvider(TenantRequestContextService)
      .useValue(tenantRequestContext)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('creates a tenant organization as an admin', async () => {
    tokenFor(UserRole.ADMIN);
    createOrgao.execute.mockResolvedValue(right(orgao({ nome: 'Secretaria' })));

    const response = await request(app.getHttpServer())
      .post('/api/orgaos')
      .set('Authorization', 'Bearer admin-token')
      .send({
        localidadeId: orgaoIds.localidadeId,
        nome: ' Secretaria ',
        sigla: ' Seob ',
        tipo: TipoOrgao.SECRETARIA,
        responsavel: ' Maria ',
        email: ' GESTAO@EXAMPLE.COM ',
        telefone: ' 85999990000 ',
      })
      .expect(201);

    const body = response.body as unknown as OrgaoResponse;
    expect(body).toMatchObject({
      id: orgaoIds.orgaoId,
      localidadeId: orgaoIds.localidadeId,
      nome: 'Secretaria',
      tipo: TipoOrgao.SECRETARIA,
      ativo: true,
    });
    expect(createOrgao.execute.mock.calls).toContainEqual([
      {
        localidadeId: orgaoIds.localidadeId,
        nome: 'Secretaria',
        sigla: 'Seob',
        tipo: TipoOrgao.SECRETARIA,
        responsavel: 'Maria',
        email: 'gestao@example.com',
        telefone: '85999990000',
        role: UserRole.ADMIN,
      },
    ]);
  });

  it('lists tenant organizations ordered by name', async () => {
    tokenFor(UserRole.USER);
    listOrgaos.execute.mockResolvedValue(
      right([orgao({ nome: 'A Secretaria' }), orgao({ nome: 'Z Secretaria' })]),
    );

    const response = await request(app.getHttpServer())
      .get('/api/orgaos')
      .set('Authorization', 'Bearer user-token')
      .expect(200);

    const body = response.body as unknown as OrgaoResponse[];
    expect(body.map((item) => item.nome)).toEqual([
      'A Secretaria',
      'Z Secretaria',
    ]);
    expect(listOrgaos.execute.mock.calls).toContainEqual([
      { role: UserRole.USER },
    ]);
  });

  it('updates supplied organization fields including active state', async () => {
    tokenFor(UserRole.ADMIN);
    updateOrgao.execute.mockResolvedValue(
      right(orgao({ nome: 'Secretaria', ativo: false })),
    );

    const response = await request(app.getHttpServer())
      .patch(`/api/orgaos/${orgaoIds.orgaoId}`)
      .set('Authorization', 'Bearer admin-token')
      .send({ ativo: false })
      .expect(200);

    const body = response.body as unknown as OrgaoResponse;
    expect(body).toMatchObject({
      id: orgaoIds.orgaoId,
      nome: 'Secretaria',
      ativo: false,
    });
    expect(updateOrgao.execute.mock.calls).toContainEqual([
      { id: orgaoIds.orgaoId, ativo: false, role: UserRole.ADMIN },
    ]);
  });

  it('rejects invalid organization payloads before the use case runs', async () => {
    tokenFor(UserRole.ADMIN);

    const response = await request(app.getHttpServer())
      .post('/api/orgaos')
      .set('Authorization', 'Bearer admin-token')
      .send({
        localidadeId: 'invalid',
        nome: '',
        tipo: 'ONG',
        email: 'invalid',
      })
      .expect(400);

    const body = response.body as unknown as MessageResponse;
    expect(body.message).toEqual(
      expect.arrayContaining([
        ErrorCodeConstants.ORGAO_INVALID_LOCALIDADE,
        ErrorCodeConstants.ORGAO_INVALID_NAME,
        ErrorCodeConstants.ORGAO_INVALID_TYPE,
        ErrorCodeConstants.ORGAO_INVALID_EMAIL,
      ]),
    );
    expect(createOrgao.execute.mock.calls).toHaveLength(0);
  });

  it('maps foreign locality references to not found', async () => {
    tokenFor(UserRole.ADMIN);
    createOrgao.execute.mockResolvedValue(
      left(
        new OrgaoRepositoryException({
          code: ErrorCodeConstants.LOCALIDADE_NOT_FOUND,
          statusCode: 404,
        }),
      ),
    );

    const response = await request(app.getHttpServer())
      .post('/api/orgaos')
      .set('Authorization', 'Bearer admin-token')
      .send({ localidadeId: orgaoIds.localidadeId, nome: 'Secretaria' })
      .expect(404);

    const body = response.body as unknown as MessageResponse;
    expect(body.message).toBe(ErrorCodeConstants.LOCALIDADE_NOT_FOUND);
  });

  it('maps absent organization updates to not found', async () => {
    tokenFor(UserRole.ADMIN);
    updateOrgao.execute.mockResolvedValue(
      left(
        new OrgaoRepositoryException({
          code: ErrorCodeConstants.ORGAO_NOT_FOUND,
          statusCode: 404,
        }),
      ),
    );

    const response = await request(app.getHttpServer())
      .patch(`/api/orgaos/${orgaoIds.orgaoId}`)
      .set('Authorization', 'Bearer admin-token')
      .send({ ativo: false })
      .expect(404);

    const body = response.body as unknown as MessageResponse;
    expect(body.message).toBe(ErrorCodeConstants.ORGAO_NOT_FOUND);
  });

  it('rejects non-admin organization writes before persistence', async () => {
    tokenFor(UserRole.STAFF);
    createOrgao.execute.mockResolvedValue(
      left(
        new OrgaoServiceException({
          code: ErrorCodeConstants.ORGAO_ACCESS_FORBIDDEN,
          statusCode: 403,
        }),
      ),
    );

    const response = await request(app.getHttpServer())
      .post('/api/orgaos')
      .set('Authorization', 'Bearer staff-token')
      .send({ localidadeId: orgaoIds.localidadeId, nome: 'Secretaria' })
      .expect(403);

    const body = response.body as unknown as MessageResponse;
    expect(body.message).toBe(
      ErrorCodeConstants.ORGAO_ACCESS_FORBIDDEN,
    );
  });

  it('creates, lists and updates sectors under an organization', async () => {
    tokenFor(UserRole.STAFF);
    createSetor.execute.mockResolvedValue(right(setor({ nome: 'Engenharia' })));
    listSetores.execute.mockResolvedValue(
      right(pageOfSetores([setorRead({ nome: 'Arquitetura' }), setorRead({ nome: 'Zeladoria' })])),
    );
    updateSetor.execute.mockResolvedValue(
      right(setor({ nome: 'Projetos', ativo: false })),
    );

    const created = await request(app.getHttpServer())
      .post(`/api/orgaos/${orgaoIds.orgaoId}/setores`)
      .set('Authorization', 'Bearer staff-token')
      .send({ nome: ' Engenharia ' })
      .expect(201);
    const listed = await request(app.getHttpServer())
      .get(`/api/orgaos/${orgaoIds.orgaoId}/setores`)
      .set('Authorization', 'Bearer staff-token')
      .expect(200);
    const updated = await request(app.getHttpServer())
      .patch(`/api/orgaos/${orgaoIds.orgaoId}/setores/${orgaoIds.setorId}`)
      .set('Authorization', 'Bearer staff-token')
      .send({ nome: ' Projetos ', ativo: false })
      .expect(200);

    const createdBody = created.body as unknown as SetorResponse;
    const listedBody = listed.body as unknown as { data: SetorResponse[]; meta: unknown };
    const updatedBody = updated.body as unknown as SetorResponse;
    expect(createdBody).toMatchObject({
      id: orgaoIds.setorId,
      orgaoId: orgaoIds.orgaoId,
      nome: 'Engenharia',
    });
    expect(listedBody.data.map((item) => item.nome)).toEqual([
      'Arquitetura',
      'Zeladoria',
    ]);
    expect(listedBody.data[0].orgao).toEqual({ id: orgaoIds.orgaoId, nome: 'Secretaria' });
    expect(updatedBody).toMatchObject({
      id: orgaoIds.setorId,
      orgaoId: orgaoIds.orgaoId,
      nome: 'Projetos',
      ativo: false,
    });
    expect(createSetor.execute.mock.calls).toContainEqual([
      { orgaoId: orgaoIds.orgaoId, nome: 'Engenharia', role: UserRole.STAFF },
    ]);
    expect(updateSetor.execute.mock.calls).toContainEqual([
      {
        id: orgaoIds.setorId,
        orgaoId: orgaoIds.orgaoId,
        nome: 'Projetos',
        ativo: false,
        role: UserRole.STAFF,
      },
    ]);
  });

  it('rejects unknown request fields through the global validation pipe', async () => {
    tokenFor(UserRole.ADMIN);

    const response = await request(app.getHttpServer())
      .post('/api/orgaos')
      .set('Authorization', 'Bearer admin-token')
      .send({
        localidadeId: orgaoIds.localidadeId,
        nome: 'Secretaria',
        totalObras: 1,
      })
      .expect(400);

    const body = response.body as unknown as MessageResponse;
    expect(body.message).toContain(
      'property totalObras should not exist',
    );
    expect(createOrgao.execute.mock.calls).toHaveLength(0);
  });

  it('maps absent organization references to not found for sectors', async () => {
    tokenFor(UserRole.STAFF);
    listSetores.execute.mockResolvedValue(
      left(
        new SetorRepositoryException({
          code: ErrorCodeConstants.ORGAO_NOT_FOUND,
          statusCode: 404,
        }),
      ),
    );

    const response = await request(app.getHttpServer())
      .get(`/api/orgaos/${orgaoIds.orgaoId}/setores`)
      .set('Authorization', 'Bearer staff-token')
      .expect(404);

    const body = response.body as unknown as MessageResponse;
    expect(body.message).toBe(ErrorCodeConstants.ORGAO_NOT_FOUND);
  });

  it('maps absent destination organizations to not found when moving sectors', async () => {
    tokenFor(UserRole.STAFF);
    updateSetor.execute.mockResolvedValue(
      left(
        new SetorRepositoryException({
          code: ErrorCodeConstants.ORGAO_NOT_FOUND,
          statusCode: 404,
        }),
      ),
    );

    const response = await request(app.getHttpServer())
      .patch(`/api/orgaos/${orgaoIds.orgaoId}/setores/${orgaoIds.setorId}`)
      .set('Authorization', 'Bearer staff-token')
      .send({ orgaoId: destinationOrgaoId })
      .expect(404);

    const body = response.body as unknown as MessageResponse;
    expect(body.message).toBe(ErrorCodeConstants.ORGAO_NOT_FOUND);
    expect(updateSetor.execute.mock.calls).toContainEqual([
      {
        id: orgaoIds.setorId,
        orgaoId: destinationOrgaoId,
        role: UserRole.STAFF,
      },
    ]);
  });

  it('maps absent sector updates to not found', async () => {
    tokenFor(UserRole.STAFF);
    updateSetor.execute.mockResolvedValue(
      left(
        new SetorRepositoryException({
          code: ErrorCodeConstants.SETOR_NOT_FOUND,
          statusCode: 404,
        }),
      ),
    );

    const response = await request(app.getHttpServer())
      .patch(`/api/orgaos/${orgaoIds.orgaoId}/setores/${orgaoIds.setorId}`)
      .set('Authorization', 'Bearer staff-token')
      .send({ ativo: false })
      .expect(404);

    const body = response.body as unknown as MessageResponse;
    expect(body.message).toBe(ErrorCodeConstants.SETOR_NOT_FOUND);
  });

  it('rejects callers without sector write permission before persistence', async () => {
    tokenFor(UserRole.USER);
    createSetor.execute.mockResolvedValue(
      left(
        new SetorServiceException({
          code: ErrorCodeConstants.SETOR_ACCESS_FORBIDDEN,
          statusCode: 403,
        }),
      ),
    );

    const response = await request(app.getHttpServer())
      .post(`/api/orgaos/${orgaoIds.orgaoId}/setores`)
      .set('Authorization', 'Bearer user-token')
      .send({ nome: 'Engenharia' })
      .expect(403);

    const body = response.body as unknown as MessageResponse;
    expect(body.message).toBe(
      ErrorCodeConstants.SETOR_ACCESS_FORBIDDEN,
    );
  });

  it('rejects absent tenant context before use cases run', async () => {
    tokenFor(UserRole.SUPERADMIN, null);

    const response = await request(app.getHttpServer())
      .get('/api/orgaos')
      .set('Authorization', 'Bearer superadmin-token')
      .expect(401);

    const body = response.body as unknown as MessageResponse;
    expect(body.message).toBe(
      ErrorCodeConstants.TENANT_CONTEXT_REQUIRED,
    );
    expect(listOrgaos.execute.mock.calls).toHaveLength(0);
  });
});

function orgao(props: { nome: string; ativo?: boolean }): OrgaoEntity {
  return OrgaoEntity.fromData({
    id: orgaoIds.orgaoId,
    localidadeId: orgaoIds.localidadeId,
    nome: props.nome,
    sigla: validOrgao.sigla,
    tipo: validOrgao.tipo,
    responsavel: validOrgao.responsavel,
    email: validOrgao.email,
    telefone: validOrgao.telefone,
    ativo: props.ativo ?? true,
    createdAt: validOrgao.createdAt,
    updatedAt: validOrgao.updatedAt,
  });
}

function setor(props: { nome: string; ativo?: boolean }): SetorEntity {
  return SetorEntity.fromData({
    id: orgaoIds.setorId,
    orgaoId: orgaoIds.orgaoId,
    nome: props.nome,
    ativo: props.ativo ?? true,
    createdAt: validSetor.createdAt,
    updatedAt: validSetor.updatedAt,
  });
}

function setorRead(props: { nome: string; ativo?: boolean }): SetorReadModel {
  return SetorReadModel.fromData({
    id: orgaoIds.setorId,
    nome: props.nome,
    ativo: props.ativo ?? true,
    createdAt: validSetor.createdAt,
    updatedAt: validSetor.updatedAt,
    orgao: { id: orgaoIds.orgaoId, nome: 'Secretaria' },
  });
}

function pageOfSetores(items: SetorReadModel[]): PageEntity<SetorReadModel> {
  return new PageEntity(items, new PageMetaEntity({ pageOptions: new PageOptionsEntity('ASC', 1, 10), itemCount: items.length }));
}
