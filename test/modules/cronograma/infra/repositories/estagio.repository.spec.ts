import { DataSource } from 'typeorm';
import { left } from '@/core/types/either';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import TenantContext from '@/core/multitenancy/tenant_context';
import EstagioEntity from '@/modules/cronograma/domain/entities/estagio.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import EstagioRepository from '@/modules/cronograma/infra/repositories/estagio.repository';
import EstagioModel from '@/modules/cronograma/infra/models/estagio.model';

const tenant = {
  tenantId: '11111111-1111-1111-1111-111111111111',
  schemaName: 'tenant_00000000000000000000000000000000',
};

const modelFrom = (stage: EstagioEntity): EstagioModel =>
  ({
    id: stage.id,
    tenantId: stage.tenantId,
    obraId: stage.obraId,
    nome: stage.nome,
    posicao: stage.posicao,
    ativo: stage.ativo,
    status: stage.status,
    modoDuracao: stage.modoDuracao,
    dataInicio: stage.dataInicio,
    dataFim: stage.dataFim,
    percentualDireto: stage.percentualDireto,
    responsavelUsuarioId: stage.responsavelUsuarioId,
    estagioPaiId: stage.estagioPaiId,
    createdAt: stage.criadoEm,
    updatedAt: stage.atualizadoEm,
  });

const stageOf = (p: {
  id?: string;
  nome: string;
  posicao?: number;
  estagioPaiId?: string | null;
}) =>
  EstagioEntity.fromData({
    id: p.id ?? '33333333-3333-3333-3333-333333333333',
    tenantId: tenant.tenantId,
    obraId: 'obra',
    nome: p.nome,
    posicao: p.posicao ?? 0,
    ativo: true,
    status: 'PENDENTE' as never,
    modoDuracao: 'NAO_INFORMADO' as never,
    dataInicio: null,
    dataFim: null,
    percentualDireto: null,
    responsavelUsuarioId: null,
    estagioPaiId: p.estagioPaiId ?? null,
    criadoEm: new Date('2026-01-01T00:00:00.000Z'),
    atualizadoEm: new Date('2026-01-01T00:00:00.000Z'),
  });

const createRepository = (estagioRepoMock: Record<string, jest.Mock>) => {
  const queryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    query: jest.fn(),
    isTransactionActive: true,
    isReleased: false,
    manager: {
      getRepository: jest.fn(() => estagioRepoMock),
    },
  };
  const dataSource = {
    createQueryRunner: jest.fn(() => queryRunner),
  } as unknown as DataSource;
  const tenantContext = new TenantContext();
  const repository = new EstagioRepository(dataSource, tenantContext);
  return { queryRunner, tenantContext, repository };
};

describe('EstagioRepository', () => {
  it('saves a stage inside the tenant transaction', async () => {
    const stage = stageOf({ nome: 'Execução' });
    const estagioRepoMock = {
      save: jest.fn(async (m: EstagioModel) => m),
    };
    const { queryRunner, tenantContext, repository } =
      createRepository(estagioRepoMock);

    const result = await tenantContext.run(tenant, () =>
      repository.save(stage),
    );

    expect(result.isRight()).toBe(true);
    expect(queryRunner.startTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunner.query).toHaveBeenCalledWith(
      expect.stringContaining(`SET LOCAL search_path TO "${tenant.schemaName}"`),
    );
    expect(estagioRepoMock.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: stage.id, nome: 'Execução' }),
    );
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunner.release).toHaveBeenCalledTimes(1);
    expect(result.value.id).toBe(stage.id);
  });

  it('saves batch stages in a single transaction', async () => {
    const stages = [stageOf({ nome: 'Projeto' }), stageOf({ nome: 'Entrega', posicao: 1 })];
    const estagioRepoMock = {
      save: jest.fn(async (items: EstagioModel[]) => items),
    };
    const { queryRunner, tenantContext, repository } =
      createRepository(estagioRepoMock);

    const result = await tenantContext.run(tenant, () =>
      repository.saveMany(stages),
    );

    expect(result.isRight()).toBe(true);
    expect(queryRunner.startTransaction).toHaveBeenCalledTimes(1);
    expect(estagioRepoMock.save).toHaveBeenCalledTimes(1);
    expect(estagioRepoMock.save.mock.calls[0][0]).toHaveLength(2);
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled();
  });

  it('rolls back and releases when save fails', async () => {
    const stage = stageOf({ nome: 'Execução' });
    const estagioRepoMock = {
      save: jest.fn().mockRejectedValue(new Error('db down')),
    };
    const { queryRunner, tenantContext, repository } =
      createRepository(estagioRepoMock);

    const result = await tenantContext.run(tenant, () =>
      repository.save(stage),
    );

    expect(result.isLeft()).toBe(true);
    expect(result.value.code).toBe(
      ErrorCodeConstants.CRONOGRAMA_REPOSITORY_FAILED,
    );
    expect(queryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalledTimes(1);
  });

  it('returns not found when stage is outside obra scope', async () => {
    const estagioRepoMock = {
      findOne: jest.fn(async () => null),
    };
    const { tenantContext, repository } = createRepository(estagioRepoMock);

    const result = await tenantContext.run(tenant, () =>
      repository.findById('stage', 'obra'),
    );

    expect(result.isLeft()).toBe(true);
    expect(result.value.code).toBe(ErrorCodeConstants.CRONOGRAMA_NOT_FOUND);
    expect(result.value.statusCode).toBe(404);
    expect(estagioRepoMock.findOne).toHaveBeenCalledWith({
      where: { id: 'stage', obraId: 'obra' },
    });
  });

  it('lists stages ordered by position with pagination', async () => {
    const stage = stageOf({ nome: 'Execução' });
    const estagioRepoMock = {
      findAndCount: jest.fn(async () => [[modelFrom(stage)], 1]),
    };
    const { tenantContext, repository } = createRepository(estagioRepoMock);
    const options = new PageOptionsEntity('ASC', 1, 10);

    const result = await tenantContext.run(tenant, () =>
      repository.list('obra', options),
    );

    expect(result.isRight()).toBe(true);
    expect(result.value.pageData).toHaveLength(1);
    expect(result.value.pageData[0].id).toBe(stage.id);
  });

  it('lists root stages only', async () => {
    const root = stageOf({ nome: 'Raiz' });
    const estagioRepoMock = {
      find: jest.fn(async () => [modelFrom(root)]),
    };
    const { tenantContext, repository } = createRepository(estagioRepoMock);

    const result = await tenantContext.run(tenant, () =>
      repository.listRootEstagios('obra'),
    );

    expect(result.isRight()).toBe(true);
    expect(estagioRepoMock.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { obraId: 'obra', estagioPaiId: expect.anything() },
      }),
    );
    expect(result.value).toHaveLength(1);
  });

  it('returns not found when reorder targets a stage outside obra', async () => {
    const estagioRepoMock = {
      findOne: jest.fn(async () => null),
      update: jest.fn(async () => ({ affected: 0 })),
    };
    const { queryRunner, tenantContext, repository } =
      createRepository(estagioRepoMock);

    const result = await tenantContext.run(tenant, () =>
      repository.reorder('obra', [
        { id: '33333333-3333-3333-3333-333333333333', posicao: 0 },
      ]),
    );

    expect(result).toEqual(
      left(
        expect.objectContaining({
          code: ErrorCodeConstants.CRONOGRAMA_NOT_FOUND,
        }),
      ),
    );
    expect(result.value.statusCode).toBe(404);
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled();
  });

  it('reorders all stages and commits', async () => {
    const stage1 = stageOf({ id: '33333333-3333-3333-3333-333333333333', nome: 'Projeto' });
    const stage2 = stageOf({ id: '44444444-4444-4444-4444-444444444444', nome: 'Entrega', posicao: 1 });
    const estagioRepoMock = {
      findOne: jest.fn(async (opts) => {
        if (opts.where.id === stage1.id) return modelFrom(stage1);
        if (opts.where.id === stage2.id) return modelFrom(stage2);
        return null;
      }),
      update: jest.fn(async () => ({ affected: 1 })),
    };
    const { queryRunner, tenantContext, repository } =
      createRepository(estagioRepoMock);

    const result = await tenantContext.run(tenant, () =>
      repository.reorder('obra', [
        { id: stage1.id, posicao: 0 },
        { id: stage2.id, posicao: 1 },
      ]),
    );

    expect(result.isRight()).toBe(true);
    expect(estagioRepoMock.findOne).toHaveBeenCalledTimes(2);
    expect(estagioRepoMock.update).toHaveBeenCalledTimes(2);
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
  });

  it('updates direct percentage and returns updated stage', async () => {
    const stage = stageOf({ nome: 'Execução' });
    const estagioRepoMock = {
      update: jest.fn(async () => ({ affected: 1 })),
      findOne: jest.fn(async () => ({
        ...modelFrom(stage),
        percentualDireto: 75.5,
      })),
    };
    const { tenantContext, repository } = createRepository(estagioRepoMock);

    const result = await tenantContext.run(tenant, () =>
      repository.updatePercentualDireto('obra', stage.id, 75.5),
    );

    expect(result.isRight()).toBe(true);
    expect(result.value.percentualDireto).toBe(75.5);
    expect(estagioRepoMock.update).toHaveBeenCalledWith(
      { id: stage.id, obraId: 'obra' },
      expect.objectContaining({ percentualDireto: 75.5 }),
    );
  });

  it('returns not found when direct percentage stage is outside obra', async () => {
    const estagioRepoMock = {
      update: jest.fn(async () => ({ affected: 0 })),
    };
    const { tenantContext, repository } = createRepository(estagioRepoMock);

    const result = await tenantContext.run(tenant, () =>
      repository.updatePercentualDireto('obra', 'stage', 50),
    );

    expect(result.isLeft()).toBe(true);
    expect(result.value.code).toBe(ErrorCodeConstants.CRONOGRAMA_NOT_FOUND);
    expect(result.value.statusCode).toBe(404);
  });

  it('calculates aggregated stage dates', async () => {
    const estagioRepoMock = {
      createQueryBuilder: jest.fn(() => {
        const qb = {
          where: jest.fn(() => qb),
          select: jest.fn(() => qb),
          addSelect: jest.fn(() => qb),
          getRawOne: jest.fn(async () => ({
            dataInicio: '2026-01-01',
            dataFim: '2026-03-01',
          })),
        };
        return qb;
      }),
    };
    const { tenantContext, repository } = createRepository(estagioRepoMock);

    const result = await tenantContext.run(tenant, () =>
      repository.datasAgregadas('obra'),
    );

    expect(result.isRight()).toBe(true);
    expect(result.value).toEqual({
      dataInicio: '2026-01-01',
      dataFim: '2026-03-01',
    });
  });

  it('returns next stage position', async () => {
    const estagioRepoMock = {
      createQueryBuilder: jest.fn(() => {
        const qb = {
          where: jest.fn(() => qb),
          select: jest.fn(() => qb),
          addSelect: jest.fn(() => qb),
          getRawOne: jest.fn(async () => ({ nextPosicao: '3' })),
        };
        return qb;
      }),
    };
    const { tenantContext, repository } = createRepository(estagioRepoMock);

    const result = await tenantContext.run(tenant, () =>
      repository.nextPosicao('obra'),
    );

    expect(result.isRight()).toBe(true);
    expect(result.value).toBe(3);
  });

  it('returns current stage ordered by position', async () => {
    const stage = stageOf({ nome: 'Execução', posicao: 1 });
    const estagioRepoMock = {
      findOne: jest.fn(async () => modelFrom(stage)),
    };
    const { tenantContext, repository } = createRepository(estagioRepoMock);

    const result = await tenantContext.run(tenant, () =>
      repository.atual('obra'),
    );

    expect(result.isRight()).toBe(true);
    expect(result.value.id).toBe(stage.id);
    expect(estagioRepoMock.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ obraId: 'obra', ativo: true }),
      }),
    );
  });

  it('returns not found when there is no current stage', async () => {
    const estagioRepoMock = {
      findOne: jest.fn(async () => null),
    };
    const { tenantContext, repository } = createRepository(estagioRepoMock);

    const result = await tenantContext.run(tenant, () =>
      repository.atual('obra'),
    );

    expect(result.isLeft()).toBe(true);
    expect(result.value.code).toBe(ErrorCodeConstants.CRONOGRAMA_NOT_FOUND);
  });

  it('reports whether a stage has children', async () => {
    const estagioRepoMock = {
      count: jest.fn(async () => 2),
    };
    const { tenantContext, repository } = createRepository(estagioRepoMock);

    const result = await tenantContext.run(tenant, () =>
      repository.hasChildren('obra', '33333333-3333-3333-3333-333333333333'),
    );

    expect(result.isRight()).toBe(true);
    expect(result.value).toBe(true);
    expect(estagioRepoMock.count).toHaveBeenCalledWith({
      where: {
        obraId: 'obra',
        estagioPaiId: '33333333-3333-3333-3333-333333333333',
      },
    });
  });

  it('reports no children when count is zero', async () => {
    const estagioRepoMock = {
      count: jest.fn(async () => 0),
    };
    const { tenantContext, repository } = createRepository(estagioRepoMock);

    const result = await tenantContext.run(tenant, () =>
      repository.hasChildren('obra', '33333333-3333-3333-3333-333333333333'),
    );

    expect(result.isRight()).toBe(true);
    expect(result.value).toBe(false);
  });

  it('removes stage and reports not found when affected is zero', async () => {
    const estagioRepoMock = {
      findOne: jest.fn(async () => null),
      update: jest.fn(async () => ({ affected: 0 })),
      delete: jest.fn(async () => ({ affected: 0 })),
    };
    const { queryRunner, tenantContext, repository } =
      createRepository(estagioRepoMock);

    const result = await tenantContext.run(tenant, () =>
      repository.remove('stage', 'obra'),
    );

    expect(result.isLeft()).toBe(true);
    expect(result.value.code).toBe(ErrorCodeConstants.CRONOGRAMA_NOT_FOUND);
    expect(result.value.statusCode).toBe(404);
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled();
  });

  it('removes stage within obra scope', async () => {
    const stage = stageOf({ id: 'stage', nome: 'Projeto' });
    const estagioRepoMock = {
      findOne: jest.fn(async () => modelFrom(stage)),
      update: jest.fn(async () => ({ affected: 1 })),
      delete: jest.fn(async () => ({ affected: 1 })),
    };
    const { tenantContext, repository } = createRepository(estagioRepoMock);

    const result = await tenantContext.run(tenant, () =>
      repository.remove('stage', 'obra'),
    );

    expect(result.isRight()).toBe(true);
    expect(estagioRepoMock.findOne).toHaveBeenCalledWith({ where: { id: 'stage', obraId: 'obra' } });
    expect(estagioRepoMock.update).toHaveBeenCalledWith(
      { obraId: 'obra', estagioPaiId: 'stage' },
      expect.objectContaining({ estagioPaiId: null }),
    );
    expect(estagioRepoMock.delete).toHaveBeenCalledWith({
      id: 'stage',
      obraId: 'obra',
    });
  });
});
