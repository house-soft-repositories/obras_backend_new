import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { left, right } from '@/core/types/either';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageMetaEntity from '@/core/pagination/domain/entities/page_meta.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import TenantContextException from '@/core/multitenancy/tenant_context.exception';
import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import type {
  AccessTokenPayload,
  ITokenService,
} from '@/modules/auth/adapters/token_service.interface';
import { TOKEN_SERVICE } from '@/modules/auth/symbols';
import { AppModule } from '@/app.module';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import EstagioEntity from '@/modules/cronograma/domain/entities/estagio.entity';
import { ESTAGIOS_SERVICE } from '@/modules/cronograma/symbols';
import type { IEstagiosUseCase } from '@/modules/cronograma/domain/usecase/estagios.usecase';

describe('Estagios API (e2e)', () => {
  let app: INestApplication<App>;
  let tokenService: jest.Mocked<ITokenService>;
  let estagiosService: jest.Mocked<IEstagiosUseCase>;

  const tenantId = '9f8b416e-2b4c-4e4a-b1c7-6beeb3d4d7dc';
  const userId = '4c67eb4d-b04d-435d-9435-5f1a8d026cf8';
  const obraId = '087f74a5-c7d0-4d60-a041-04fc81816714';
  const stageOneId = '6b072d5f-936f-4523-96d7-9938be30eb12';
  const stageTwoId = '1056b967-e280-480f-8277-f658aa894bc2';
  const stageThreeId = 'bb7d2f9d-161f-453e-8e75-31d5f58f1f48';

  const tokenFor = (
    role: UserRole = UserRole.ADMIN,
    selectedTenantId: string | null = tenantId,
  ) => {
    tokenService.verifyAccess.mockResolvedValue({
      sub: userId,
      type: 'access',
      role,
      tenantId: selectedTenantId,
    } as AccessTokenPayload);
  };

  const stage = (id: string, nome: string, posicao: number) =>
    EstagioEntity.fromData({
      id,
      tenantId,
      obraId,
      nome,
      posicao,
      ativo: true,
      status: 'PENDENTE' as any,
      modoDuracao: 'NAO_INFORMADO' as any,
      dataInicio: null,
      dataFim: null,
      percentualDireto: null,
      responsavelUsuarioId: null,
      criadoEm: new Date('2026-01-01T00:00:00.000Z'),
      atualizadoEm: new Date('2026-01-01T00:00:00.000Z'),
    });

  beforeEach(async () => {
    tokenService = {
      signAccess: jest.fn(),
      signRefresh: jest.fn(),
      verifyAccess: jest.fn(),
      verifyRefresh: jest.fn(),
    } as any;
    estagiosService = {
      create: jest.fn(),
      createMany: jest.fn(),
      list: jest.fn(),
      get: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      reorder: jest.fn(),
      predefinidos: jest.fn(),
    } as any;
    const tenantRequestContext: Pick<TenantRequestContextService, 'run'> = {
      run: jest.fn(
        <T>(user: AccessTokenPayload | undefined, cb: () => Promise<T>) => {
          if (!user || !user.tenantId) throw new TenantContextException();
          return cb();
        },
      ),
    };
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(TOKEN_SERVICE)
      .useValue(tokenService)
      .overrideProvider(ESTAGIOS_SERVICE)
      .useValue(estagiosService)
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

  it('creates three stages, reorders, lists and keeps ordered response', async () => {
    tokenFor();
    const initialStages = [
      stage(stageOneId, 'Projeto', 0),
      stage(stageTwoId, 'Licitação', 1),
      stage(stageThreeId, 'Execução', 2),
    ];
    estagiosService.createMany.mockResolvedValue(right(initialStages));
    estagiosService.reorder.mockResolvedValue(right(undefined));
    estagiosService.list.mockResolvedValue(
      right(
        new PageEntity(
          [
            stage(stageThreeId, 'Execução', 0),
            stage(stageOneId, 'Projeto', 1),
            stage(stageTwoId, 'Licitação', 2),
          ],
          new PageMetaEntity({
            pageOptions: new PageOptionsEntity('ASC', 1, 10),
            itemCount: 3,
          }),
        ),
      ),
    );

    const lote = await request(app.getHttpServer())
      .post(`/api/obras/${obraId}/estagios/lote`)
      .set('Authorization', 'Bearer token')
      .send({
        itens: [
          { nome: 'Projeto' },
          { nome: 'Licitação' },
          { nome: 'Execução' },
        ],
      })
      .expect(201);

    expect(lote.body.map((item: any) => item.nome)).toEqual([
      'Projeto',
      'Licitação',
      'Execução',
    ]);
    expect(estagiosService.createMany).toHaveBeenCalledWith(
      obraId,
      expect.arrayContaining([
        expect.objectContaining({ obraId, nome: 'Projeto' }),
        expect.objectContaining({ obraId, nome: 'Licitação' }),
        expect.objectContaining({ obraId, nome: 'Execução' }),
      ]),
    );

    await request(app.getHttpServer())
      .post(`/api/obras/${obraId}/estagios/reordenar`)
      .set('Authorization', 'Bearer token')
      .send({
        itens: [
          { id: stageThreeId, posicao: 0 },
          { id: stageOneId, posicao: 1 },
          { id: stageTwoId, posicao: 2 },
        ],
      })
      .expect(201);

    const list = await request(app.getHttpServer())
      .get(`/api/obras/${obraId}/estagios?page=1&take=10&order=ASC`)
      .set('Authorization', 'Bearer token')
      .expect(200);

    expect(estagiosService.reorder).toHaveBeenCalledWith(obraId, [
      { id: stageThreeId, posicao: 0 },
      { id: stageOneId, posicao: 1 },
      { id: stageTwoId, posicao: 2 },
    ]);
    expect(list.body.data.map((item: any) => item.nome)).toEqual([
      'Execução',
      'Projeto',
      'Licitação',
    ]);
    expect(list.body.meta.itemCount).toBe(3);
  });

  it('creates, gets, updates and removes a stage', async () => {
    tokenFor();
    estagiosService.create.mockResolvedValue(
      right(stage(stageOneId, 'Projeto', 0)),
    );
    estagiosService.get.mockResolvedValue(
      right(stage(stageOneId, 'Projeto', 0)),
    );
    estagiosService.update.mockResolvedValue(
      right(stage(stageOneId, 'Projeto executivo', 0)),
    );
    estagiosService.remove.mockResolvedValue(right(undefined));

    const created = await request(app.getHttpServer())
      .post(`/api/obras/${obraId}/estagios`)
      .set('Authorization', 'Bearer token')
      .send({ nome: 'Projeto', posicao: 0 })
      .expect(201);
    expect(created.body).toMatchObject({
      id: stageOneId,
      obraId,
      nome: 'Projeto',
      posicao: 0,
    });

    await request(app.getHttpServer())
      .get(`/api/obras/${obraId}/estagios/${stageOneId}`)
      .set('Authorization', 'Bearer token')
      .expect(200);

    const updated = await request(app.getHttpServer())
      .patch(`/api/obras/${obraId}/estagios/${stageOneId}`)
      .set('Authorization', 'Bearer token')
      .send({ nome: 'Projeto executivo' })
      .expect(200);
    expect(updated.body.nome).toBe('Projeto executivo');

    await request(app.getHttpServer())
      .delete(`/api/obras/${obraId}/estagios/${stageOneId}`)
      .set('Authorization', 'Bearer token')
      .expect(204);
  });

  it('returns predefined stages without obra id dependency', async () => {
    tokenFor();
    estagiosService.predefinidos.mockResolvedValue(
      right([{ nome: 'Planejamento', posicao: 0 }]),
    );
    const res = await request(app.getHttpServer())
      .get(`/api/obras/${obraId}/estagios/predefinidos`)
      .set('Authorization', 'Bearer token')
      .expect(200);
    expect(res.body).toEqual([{ nome: 'Planejamento', posicao: 0 }]);
  });

  it('maps service not found to 404 for cross-tenant or unknown obra/stage', async () => {
    tokenFor();
    estagiosService.get.mockResolvedValue(
      left({
        code: ErrorCodeConstants.CRONOGRAMA_NOT_FOUND,
        statusCode: 404,
        message: ErrorCodeConstants.CRONOGRAMA_NOT_FOUND,
      } as any),
    );
    await request(app.getHttpServer())
      .get(`/api/obras/${obraId}/estagios/${stageOneId}`)
      .set('Authorization', 'Bearer token')
      .expect(404);
  });

  it('rejects invalid stage payload and does not call service', async () => {
    tokenFor();
    await request(app.getHttpServer())
      .post(`/api/obras/${obraId}/estagios`)
      .set('Authorization', 'Bearer token')
      .send({ nome: '', posicao: -1 })
      .expect(400);
    expect(estagiosService.create).not.toHaveBeenCalled();
  });

  it('requires authentication before accessing routes', async () => {
    await request(app.getHttpServer())
      .get(`/api/obras/${obraId}/estagios`)
      .expect(401);
  });

  it('requires tenant context for authenticated users', async () => {
    tokenFor(UserRole.ADMIN, null);
    await request(app.getHttpServer())
      .get(`/api/obras/${obraId}/estagios`)
      .set('Authorization', 'Bearer token')
      .expect(401);
  });
});
