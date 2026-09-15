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
import EstagioAcompanhamentoEntity from '@/modules/cronograma/domain/entities/estagio_acompanhamento.entity';
import EstagioComentarioEntity from '@/modules/cronograma/domain/entities/estagio_comentario.entity';
import MedicaoEntity from '@/modules/cronograma/domain/entities/medicao.entity';
import { ESTAGIOS_SERVICE } from '@/modules/cronograma/symbols';
import type { IEstagiosUseCase } from '@/modules/cronograma/domain/usecase/estagios.usecase';
import {
  EstagioStatus,
  TipoMedicao,
} from '@/modules/cronograma/domain/enums/cronograma.enums';

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
  const fonteOneId = '7d444840-9dc0-41d1-b245-5ffd4e1a6a6a';
  const fonteTwoId = '8e555951-aed1-42e2-8356-600e5f2b7b7b';

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
      createAcompanhamento: jest.fn(),
      createComentario: jest.fn(),
      updatePercentualDireto: jest.fn(),
      datasAgregadas: jest.fn(),
      createMedicao: jest.fn(),
      listMedicoes: jest.fn(),
      concluir: jest.fn(),
      duplicar: jest.fn(),
      atual: jest.fn(),
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

  it('posts acompanhamento and comentario, gets aggregated dates, and patches direct percentage', async () => {
    tokenFor();
    estagiosService.createAcompanhamento.mockResolvedValue(
      right(
        EstagioAcompanhamentoEntity.fromData({
          id: 'a69b3ead-d36b-4bd3-9d24-f01898af1cb6',
          tenantId,
          obraId,
          estagioId: stageOneId,
          percentual: 42,
          data: '2026-02-01',
          observacao: 'Avanço físico',
          autorUsuarioId: userId,
          criadoEm: new Date('2026-02-01T00:00:00.000Z'),
        }),
      ),
    );
    estagiosService.createComentario.mockResolvedValue(
      right(
        EstagioComentarioEntity.fromData({
          id: '4eb15983-bd0a-4085-9528-0f28dd1037af',
          tenantId,
          obraId,
          estagioId: stageOneId,
          texto: 'Comentário de obra',
          autorUsuarioId: userId,
          criadoEm: new Date('2026-02-01T00:00:00.000Z'),
        }),
      ),
    );
    estagiosService.datasAgregadas.mockResolvedValue(
      right({ dataInicio: '2026-01-10', dataFim: '2026-03-20' }),
    );
    estagiosService.updatePercentualDireto.mockResolvedValue(
      right(stage(stageOneId, 'Projeto', 0)),
    );

    const acompanhamento = await request(app.getHttpServer())
      .post(`/api/obras/${obraId}/estagios/${stageOneId}/acompanhamentos`)
      .set('Authorization', 'Bearer token')
      .send({ percentual: 42, data: '2026-02-01', observacao: 'Avanço físico' })
      .expect(201);
    expect(acompanhamento.body).toMatchObject({
      percentual: 42,
      autorUsuarioId: userId,
    });
    expect(estagiosService.createAcompanhamento).toHaveBeenCalledWith(
      expect.objectContaining({
        obraId,
        estagioId: stageOneId,
        autorUsuarioId: userId,
      }),
    );

    const comentario = await request(app.getHttpServer())
      .post(`/api/obras/${obraId}/estagios/${stageOneId}/comentarios`)
      .set('Authorization', 'Bearer token')
      .send({ texto: 'Comentário de obra' })
      .expect(201);
    expect(comentario.body).toMatchObject({
      texto: 'Comentário de obra',
      autorUsuarioId: userId,
    });

    const datas = await request(app.getHttpServer())
      .get(`/api/obras/${obraId}/estagios/datas-agregadas`)
      .set('Authorization', 'Bearer token')
      .expect(200);
    expect(datas.body).toEqual({
      dataInicio: '2026-01-10',
      dataFim: '2026-03-20',
    });

    await request(app.getHttpServer())
      .patch(`/api/obras/${obraId}/estagios/${stageOneId}/percentual-direto`)
      .set('Authorization', 'Bearer token')
      .send({ percentual: 75 })
      .expect(200);
    expect(estagiosService.updatePercentualDireto).toHaveBeenCalledWith(
      obraId,
      stageOneId,
      75,
    );
  });

  it('maps P2 stage scope failures to 404', async () => {
    tokenFor();
    estagiosService.createAcompanhamento.mockResolvedValue(
      left({
        code: ErrorCodeConstants.CRONOGRAMA_NOT_FOUND,
        statusCode: 404,
        message: ErrorCodeConstants.CRONOGRAMA_NOT_FOUND,
      } as any),
    );

    await request(app.getHttpServer())
      .post(`/api/obras/${obraId}/estagios/${stageOneId}/acompanhamentos`)
      .set('Authorization', 'Bearer token')
      .send({ percentual: 42, data: '2026-02-01' })
      .expect(404);
  });

  it('rejects invalid P2 payloads before calling service', async () => {
    tokenFor();

    await request(app.getHttpServer())
      .post(`/api/obras/${obraId}/estagios/${stageOneId}/acompanhamentos`)
      .set('Authorization', 'Bearer token')
      .send({ percentual: 101, data: 'invalid-date' })
      .expect(400);

    await request(app.getHttpServer())
      .post(`/api/obras/${obraId}/estagios/${stageOneId}/comentarios`)
      .set('Authorization', 'Bearer token')
      .send({ texto: '' })
      .expect(400);

    await request(app.getHttpServer())
      .patch(`/api/obras/${obraId}/estagios/${stageOneId}/percentual-direto`)
      .set('Authorization', 'Bearer token')
      .send({ percentual: -1 })
      .expect(400);

    expect(estagiosService.createAcompanhamento).not.toHaveBeenCalled();
    expect(estagiosService.createComentario).not.toHaveBeenCalled();
    expect(estagiosService.updatePercentualDireto).not.toHaveBeenCalled();
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

  it('creates and lists medicoes, concludes, duplicates and gets current stage', async () => {
    tokenFor();
    const medicao = MedicaoEntity.fromData({
      id: 'e4f1509d-3654-4d0a-9b72-6f55c4ef7d4d',
      tenantId,
      obraId,
      numero: 1,
      tipo: TipoMedicao.NORMAL,
      dataMedicao: '2026-03-01',
      observacao: null,
      criadoEm: new Date('2026-03-01T00:00:00.000Z'),
      itens: [
        {
          id: '7b0b46e6-85e4-43ff-a9f2-56373f64aa8a',
          tenantId,
          medicaoId: 'e4f1509d-3654-4d0a-9b72-6f55c4ef7d4d',
          fonteId: fonteOneId,
          valor: 100,
        },
        {
          id: '7865ebc0-5f51-4e78-8e2d-16d2d0a952f4',
          tenantId,
          medicaoId: 'e4f1509d-3654-4d0a-9b72-6f55c4ef7d4d',
          fonteId: fonteTwoId,
          valor: 200,
        },
      ],
    });
    estagiosService.createMedicao.mockResolvedValue(right(medicao));
    estagiosService.listMedicoes.mockResolvedValue(
      right(
        new PageEntity(
          [medicao],
          new PageMetaEntity({
            pageOptions: new PageOptionsEntity('ASC', 1, 10),
            itemCount: 1,
          }),
        ),
      ),
    );
    estagiosService.concluir.mockResolvedValue(
      right(
        EstagioEntity.fromData({
          ...stage(stageOneId, 'Projeto', 0).toObject(),
          status: EstagioStatus.CONCLUIDO,
          percentualDireto: 100,
        }),
      ),
    );
    estagiosService.duplicar.mockResolvedValue(
      right(stage('34a8c44a-970f-42f1-a6ca-d122d257e563', 'Projeto', 3)),
    );
    estagiosService.atual.mockResolvedValue(
      right(stage(stageTwoId, 'Licitação', 1)),
    );

    const created = await request(app.getHttpServer())
      .post(`/api/obras/${obraId}/medicoes`)
      .set('Authorization', 'Bearer token')
      .send({
        tipo: TipoMedicao.NORMAL,
        dataMedicao: '2026-03-01',
        itens: [
          { fonteId: fonteOneId, valor: 100 },
          { fonteId: fonteTwoId, valor: 200 },
        ],
      })
      .expect(201);
    expect(created.body.itens).toHaveLength(2);

    const listed = await request(app.getHttpServer())
      .get(`/api/obras/${obraId}/medicoes?page=1&take=10`)
      .set('Authorization', 'Bearer token')
      .expect(200);
    expect(listed.body.data[0].numero).toBe(1);

    const concluded = await request(app.getHttpServer())
      .post(`/api/obras/${obraId}/estagios/${stageOneId}/concluir`)
      .set('Authorization', 'Bearer token')
      .expect(201);
    expect(concluded.body.status).toBe(EstagioStatus.CONCLUIDO);

    const duplicated = await request(app.getHttpServer())
      .post(`/api/obras/${obraId}/estagios/${stageOneId}/duplicar`)
      .set('Authorization', 'Bearer token')
      .expect(201);
    expect(duplicated.body.posicao).toBe(3);

    const atual = await request(app.getHttpServer())
      .get(`/api/obras/${obraId}/estagios/atual`)
      .set('Authorization', 'Bearer token')
      .expect(200);
    expect(atual.body.id).toBe(stageTwoId);
  });

  it('maps invalid medicao fonte to 422', async () => {
    tokenFor();
    estagiosService.createMedicao.mockResolvedValue(
      left({
        code: ErrorCodeConstants.MEDICAO_FONTE_INVALIDA,
        statusCode: 422,
        message: ErrorCodeConstants.MEDICAO_FONTE_INVALIDA,
      } as any),
    );
    await request(app.getHttpServer())
      .post(`/api/obras/${obraId}/medicoes`)
      .set('Authorization', 'Bearer token')
      .send({
        tipo: TipoMedicao.NORMAL,
        dataMedicao: '2026-03-01',
        itens: [{ fonteId: fonteOneId, valor: 100 }],
      })
      .expect(422);
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
