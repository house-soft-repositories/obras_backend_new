import ErrorCodeConstants from '@/core/constants/error_code.constants';
import TenantContextException from '@/core/multitenancy/tenant_context.exception';
import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import { left, right } from '@/core/types/either';
import ITokenService, {
  AccessTokenPayload,
} from '@/modules/auth/adapters/token_service.interface';
import { TOKEN_SERVICE } from '@/modules/auth/symbols';
import LocalidadeEntity from '@/modules/localidades/domain/entities/localidade.entity';
import { TipoLocalidade } from '@/modules/localidades/domain/enums/tipo_localidade.enum';
import ICreateLocalidadeUseCase from '@/modules/localidades/domain/usecase/create_localidade.usecase';
import IListLocalidadesUseCase from '@/modules/localidades/domain/usecase/list_localidades.usecase';
import IUpdateLocalidadeUseCase from '@/modules/localidades/domain/usecase/update_localidade.usecase';
import LocalidadeRepositoryException from '@/modules/localidades/exceptions/localidade_repository.exception';
import LocalidadeServiceException from '@/modules/localidades/exceptions/localidade_service.exception';
import {
  CREATE_LOCALIDADE_SERVICE,
  LIST_LOCALIDADES_SERVICE,
  UPDATE_LOCALIDADE_SERVICE,
} from '@/modules/localidades/symbols';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import { AppModule } from '@/app.module';
import {
  localidadeIds,
  validLocalidade,
} from '@test/constants/localidades/domain/entities/localidade.constants';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

type MessageResponse = {
  message: string | string[];
};

type LocalidadeResponse = {
  id: string;
  nome: string;
  uf: string;
  codigoIbge: string | null;
  tipo: TipoLocalidade | null;
  municipio: string | null;
  observacoes: string | null;
  createdAt: string;
  updatedAt: string;
};

describe('Localidades API (e2e)', () => {
  let app: INestApplication<App>;
  let tokenService: jest.Mocked<ITokenService>;
  let createLocalidade: jest.Mocked<ICreateLocalidadeUseCase>;
  let listLocalidades: jest.Mocked<IListLocalidadesUseCase>;
  let updateLocalidade: jest.Mocked<IUpdateLocalidadeUseCase>;

  const tokenFor = (
    role: UserRole,
    tokenTenantId: string | null = localidadeIds.tenantId,
  ) => {
    tokenService.verifyAccess.mockResolvedValue({
      sub: localidadeIds.userId,
      type: 'access',
      role,
      tenantId: tokenTenantId,
    });
  };

  const localidade = (props: {
    id?: string;
    nome: string;
    uf?: string;
    municipio?: string | null;
  }) =>
    LocalidadeEntity.fromData({
      id: props.id ?? localidadeIds.localidadeId,
      nome: props.nome,
      uf: props.uf ?? 'CE',
      codigoIbge: validLocalidade.codigoIbge ?? '2304400',
      tipo: TipoLocalidade.DISTRITO,
      municipio: props.municipio ?? 'Fortaleza',
      observacoes: validLocalidade.observacoes,
      createdAt: validLocalidade.createdAt,
      updatedAt: validLocalidade.updatedAt,
    });

  beforeEach(async () => {
    tokenService = {
      signAccess: jest.fn(),
      signRefresh: jest.fn(),
      verifyAccess: jest.fn(),
      verifyRefresh: jest.fn(),
    };
    createLocalidade = { execute: jest.fn() };
    listLocalidades = { execute: jest.fn() };
    updateLocalidade = { execute: jest.fn() };
    const tenantRequestContext: Pick<TenantRequestContextService, 'run'> = {
      run: jest.fn(
        <T>(user: AccessTokenPayload | undefined, callback: () => Promise<T>) => {
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
      .overrideProvider(CREATE_LOCALIDADE_SERVICE)
      .useValue(createLocalidade)
      .overrideProvider(LIST_LOCALIDADES_SERVICE)
      .useValue(listLocalidades)
      .overrideProvider(UPDATE_LOCALIDADE_SERVICE)
      .useValue(updateLocalidade)
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

  it('creates a tenant-scoped locality as an admin', async () => {
    tokenFor(UserRole.ADMIN);
    createLocalidade.execute.mockResolvedValue(
      right(localidade({ nome: 'Centro' })),
    );

    const response = await request(app.getHttpServer())
      .post('/api/localidades')
      .set('Authorization', 'Bearer admin-token')
      .send({
        nome: '  Centro  ',
        uf: 'ce',
        codigoIbge: '2304400',
        tipo: TipoLocalidade.DISTRITO,
        municipio: ' Fortaleza ',
        observacoes: null,
      })
      .expect(201);

    const body = response.body as unknown as LocalidadeResponse;
    expect(body).toEqual({
      id: localidadeIds.localidadeId,
      nome: 'Centro',
      uf: 'CE',
      codigoIbge: '2304400',
      tipo: TipoLocalidade.DISTRITO,
      municipio: 'Fortaleza',
      observacoes: null,
      createdAt: '2026-09-04T10:00:00.000Z',
      updatedAt: '2026-09-04T10:05:00.000Z',
    });
    expect(createLocalidade.execute.mock.calls).toContainEqual([
      {
        nome: 'Centro',
        uf: 'CE',
        codigoIbge: '2304400',
        tipo: TipoLocalidade.DISTRITO,
        municipio: 'Fortaleza',
        observacoes: null,
        role: UserRole.ADMIN,
      },
    ]);
  });

  it('lists verified tenant localities ordered by name', async () => {
    tokenFor(UserRole.STAFF);
    listLocalidades.execute.mockResolvedValue(
      right([
        localidade({ nome: 'Aldeota' }),
        localidade({
          id: localidadeIds.foreignLocalidadeId,
          nome: 'Centro',
        }),
      ]),
    );

    const response = await request(app.getHttpServer())
      .get('/api/localidades')
      .set('Authorization', 'Bearer staff-token')
      .expect(200);

    const body = response.body as unknown as LocalidadeResponse[];
    expect(body.map((item) => item.nome)).toEqual(['Aldeota', 'Centro']);
    expect(listLocalidades.execute.mock.calls).toContainEqual([
      { role: UserRole.STAFF },
    ]);
  });

  it('updates only supplied mutable fields as an admin', async () => {
    tokenFor(UserRole.ADMIN);
    updateLocalidade.execute.mockResolvedValue(
      right(localidade({ nome: 'Centro', municipio: 'Sobral' })),
    );

    const response = await request(app.getHttpServer())
      .patch(`/api/localidades/${localidadeIds.localidadeId}`)
      .set('Authorization', 'Bearer admin-token')
      .send({ municipio: ' Sobral ' })
      .expect(200);

    const body = response.body as unknown as LocalidadeResponse;
    expect(body).toMatchObject({
      id: localidadeIds.localidadeId,
      nome: 'Centro',
      municipio: 'Sobral',
    });
    expect(updateLocalidade.execute.mock.calls).toContainEqual([
      {
        id: localidadeIds.localidadeId,
        municipio: 'Sobral',
        role: UserRole.ADMIN,
      },
    ]);
  });

  it('rejects invalid locality payloads before the use case runs', async () => {
    tokenFor(UserRole.ADMIN);

    const response = await request(app.getHttpServer())
      .post('/api/localidades')
      .set('Authorization', 'Bearer admin-token')
      .send({
        nome: '',
        uf: 'CEA',
        tipo: 'CIDADE',
      })
      .expect(400);

    const body = response.body as unknown as MessageResponse;
    expect(body.message).toEqual(
      expect.arrayContaining([
        ErrorCodeConstants.LOCALIDADE_INVALID_NAME,
        ErrorCodeConstants.LOCALIDADE_INVALID_UF,
        ErrorCodeConstants.LOCALIDADE_INVALID_TYPE,
      ]),
    );
    expect(createLocalidade.execute.mock.calls).toHaveLength(0);
  });

  it('rejects missing required locality fields with registered codes', async () => {
    tokenFor(UserRole.ADMIN);

    const response = await request(app.getHttpServer())
      .post('/api/localidades')
      .set('Authorization', 'Bearer admin-token')
      .send({})
      .expect(400);

    const body = response.body as unknown as MessageResponse;
    expect(body.message).toEqual(
      expect.arrayContaining([
        ErrorCodeConstants.LOCALIDADE_INVALID_NAME,
        ErrorCodeConstants.LOCALIDADE_INVALID_UF,
      ]),
    );
    expect(createLocalidade.execute.mock.calls).toHaveLength(0);
  });

  it('rejects malformed locality identifiers before the update use case runs', async () => {
    tokenFor(UserRole.ADMIN);

    const response = await request(app.getHttpServer())
      .patch('/api/localidades/not-a-uuid')
      .set('Authorization', 'Bearer admin-token')
      .send({ municipio: 'Sobral' })
      .expect(404);

    const body = response.body as unknown as MessageResponse;
    expect(body.message).toBe(ErrorCodeConstants.LOCALIDADE_NOT_FOUND);
    expect(updateLocalidade.execute.mock.calls).toHaveLength(0);
  });

  it('rejects unknown request fields through the global validation pipe', async () => {
    tokenFor(UserRole.ADMIN);

    const response = await request(app.getHttpServer())
      .post('/api/localidades')
      .set('Authorization', 'Bearer admin-token')
      .send({
        nome: 'Centro',
        uf: 'CE',
        totalObras: 1,
      })
      .expect(400);

    const body = response.body as unknown as MessageResponse;
    expect(body.message).toContain(
      'property totalObras should not exist',
    );
    expect(createLocalidade.execute.mock.calls).toHaveLength(0);
  });

  it('maps foreign-tenant locality identifiers to not found', async () => {
    tokenFor(UserRole.ADMIN);
    updateLocalidade.execute.mockResolvedValue(
      left(
        new LocalidadeRepositoryException({
          code: ErrorCodeConstants.LOCALIDADE_NOT_FOUND,
          statusCode: 404,
        }),
      ),
    );

    const response = await request(app.getHttpServer())
      .patch(`/api/localidades/${localidadeIds.foreignLocalidadeId}`)
      .set('Authorization', 'Bearer admin-token')
      .send({ municipio: 'Sobral' })
      .expect(404);

    const body = response.body as unknown as MessageResponse;
    expect(body.message).toBe(ErrorCodeConstants.LOCALIDADE_NOT_FOUND);
  });

  it('rejects absent tenant context before locality use cases run', async () => {
    tokenFor(UserRole.SUPERADMIN, null);

    const response = await request(app.getHttpServer())
      .get('/api/localidades')
      .set('Authorization', 'Bearer superadmin-token')
      .expect(401);

    const body = response.body as unknown as MessageResponse;
    expect(body.message).toBe(
      ErrorCodeConstants.TENANT_CONTEXT_REQUIRED,
    );
    expect(listLocalidades.execute.mock.calls).toHaveLength(0);
  });

  it('rejects callers without write permission before persistence', async () => {
    tokenFor(UserRole.USER);
    createLocalidade.execute.mockResolvedValue(
      left(
        new LocalidadeServiceException({
          code: ErrorCodeConstants.LOCALIDADE_ACCESS_FORBIDDEN,
          statusCode: 403,
        }),
      ),
    );

    const response = await request(app.getHttpServer())
      .post('/api/localidades')
      .set('Authorization', 'Bearer user-token')
      .send({ nome: 'Centro', uf: 'CE' })
      .expect(403);

    const body = response.body as unknown as MessageResponse;
    expect(body.message).toBe(
      ErrorCodeConstants.LOCALIDADE_ACCESS_FORBIDDEN,
    );
  });

  it('rejects unauthenticated locality requests before use cases run', async () => {
    await request(app.getHttpServer()).get('/api/localidades').expect(401);

    expect(listLocalidades.execute.mock.calls).toHaveLength(0);
  });
});
