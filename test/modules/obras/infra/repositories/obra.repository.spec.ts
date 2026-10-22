import { EntityNotFoundError, Repository } from 'typeorm';
import { withManager } from '@/core/multitenancy/tenant_manager';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import TenantContext from '@/core/multitenancy/tenant_context';
import ObraEntity from '@/modules/obras/domain/entities/obra.entity';
import { StatusObra } from '@/modules/obras/domain/enums/status_obra.enum';
import { TipoObra } from '@/modules/obras/domain/enums/tipo_obra.enum';
import ObraMapper from '@/modules/obras/infra/mapper/obra.mapper';
import ObraModel from '@/modules/obras/infra/models/obra.model';
import ObraRepository from '@/modules/obras/infra/repositories/obra.repository';

jest.mock('@/core/multitenancy/tenant_manager', () => ({
  withManager: jest.fn(),
}));

const mockedWithManager = jest.mocked(withManager);

describe('ObraRepository', () => {
  const tenantContext = {
    require: jest.fn(() => ({ tenantId: 'tenant-1', schemaName: 'tenant_1' })),
  } as unknown as TenantContext;
  const dataSource = {} as never;
  const repository = new ObraRepository(dataSource, tenantContext);
  const obraEntity = ObraEntity.create({
    codigo: 'OBR-2026-0001',
    nome: 'Reforma Escola',
    tipo: TipoObra.OBRA,
    status: StatusObra.EM_ABERTO,
    orgaoId: 'org-1',
    criadoPorUsuarioId: 'user-1',
  });
  const obraModel = Object.assign(
    new ObraModel(),
    ObraMapper.toModel(obraEntity),
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function managerFor(modelRepository: Partial<Repository<ObraModel>>) {
    return {
      getRepository: jest.fn(() => modelRepository),
    };
  }

  function resolveManager(manager: object) {
    mockedWithManager.mockImplementationOnce(
      async (_dataSource, _context, callback) => callback(manager as never),
    );
  }

  it('saves through the tenant manager and maps model to entity', async () => {
    const modelRepository = {
      create: jest.fn((model) => model as ObraModel),
      save: jest.fn().mockResolvedValue(obraModel),
    };
    resolveManager(managerFor(modelRepository));

    const result = await repository.save(obraEntity);

    expect(result.isRight()).toBe(true);
    expect(modelRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: TipoObra.OBRA }),
    );
    expect(modelRepository.save).toHaveBeenCalledWith(obraModel);
    expect(mockedWithManager).toHaveBeenCalledWith(
      dataSource,
      tenantContext,
      expect.any(Function),
    );
    expect(result.getOrThrow().tipo).toBe(TipoObra.OBRA);
  });

  it('maps duplicate save failures to the duplicate code', async () => {
    const modelRepository = {
      create: jest.fn(),
      save: jest.fn().mockRejectedValue({ code: '23505' }),
    };
    resolveManager(managerFor(modelRepository));

    const result = await repository.save(obraEntity);

    expect(result.isLeft()).toBe(true);
    expect(result.value).toMatchObject({
      code: ErrorCodeConstants.OBRA_DUPLICATE_CODIGO,
      statusCode: 409,
    });
  });

  it('maps unexpected save failures to repository failure', async () => {
    const cause = new Error('connection failed');
    const modelRepository = {
      create: jest.fn(),
      save: jest.fn().mockRejectedValue(cause),
    };
    resolveManager(managerFor(modelRepository));

    const result = await repository.save(obraEntity);

    expect(result.isLeft()).toBe(true);
    expect(result.value).toMatchObject({
      code: ErrorCodeConstants.OBRA_REPOSITORY_FAILED,
      statusCode: 500,
      cause,
    });
  });

  it('finds the last code and returns null when there is no code', async () => {
    const findOne = jest
      .fn()
      .mockResolvedValueOnce(obraModel)
      .mockResolvedValueOnce(null);
    resolveManager(managerFor({ findOne }));
    const found = await repository.findLastCodigo(2026);
    resolveManager(managerFor({ findOne }));
    const missing = await repository.findLastCodigo(2026);

    expect(found.getOrThrow()).toBe(obraModel.codigo);
    expect(missing.getOrThrow()).toBeNull();
    expect(findOne).toHaveBeenNthCalledWith(1, {
      where: { codigo: expect.anything() },
      order: { codigo: 'DESC' },
    });
  });

  it.each([
    ['findById', () => repository.findById('obra-1')],
    ['findOneWithRelations', () => repository.findOneWithRelations('obra-1')],
  ])(
    '%s returns a mapped entity and handles missing models',
    async (_name, execute) => {
      const findOne = jest.fn().mockResolvedValue(obraModel);
      resolveManager(managerFor({ findOne }));
      const found = await execute();
      expect(found.getOrThrow()).toBeInstanceOf(ObraEntity);

      resolveManager(
        managerFor({ findOne: jest.fn().mockResolvedValue(null) }),
      );
      const missing = await execute();
      expect(missing.getOrThrow()).toBeNull();
    },
  );

  it('maps find failures, including EntityNotFoundError, to repository failure', async () => {
    const cause = new EntityNotFoundError(ObraModel, 'obra-1');
    resolveManager(managerFor({ findOne: jest.fn().mockRejectedValue(cause) }));

    const result = await repository.findById('obra-1');

    expect(result.isLeft()).toBe(true);
    expect(result.value).toMatchObject({
      code: ErrorCodeConstants.OBRA_REPOSITORY_FAILED,
      cause,
    });
  });

  it('applies page filters and maps paginated models', async () => {
    const query = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[obraModel], 17]),
    };
    const modelRepository = { createQueryBuilder: jest.fn(() => query) };
    resolveManager(managerFor(modelRepository));

    const result = await repository.findPage({
      status: StatusObra.EM_ABERTO,
      tipo: TipoObra.OBRA,
      orgaoId: 'org-1',
      q: 'escola',
      pageOptions: { page: 2, take: 10, skip: 10 } as never,
    });

    const page = result.getOrThrow();
    expect(page.pageData[0]).toBeInstanceOf(ObraEntity);
    expect(query.andWhere).toHaveBeenCalledTimes(4);
    expect(query.take).toHaveBeenCalledWith(10);
    expect(query.skip).toHaveBeenCalledWith(10);
    expect(page.pageMeta.itemCount).toBe(17);
  });

  it('updates an existing model and returns not found for a missing model', async () => {
    const modelRepository = {
      findOne: jest.fn().mockResolvedValue(obraModel),
      merge: jest.fn((_existing, model) => ({ ...obraModel, ...model })),
      save: jest.fn().mockResolvedValue(obraModel),
    };
    resolveManager(managerFor(modelRepository));
    const updated = await repository.updatePartial(obraEntity);
    expect(updated.getOrThrow()).toBeInstanceOf(ObraEntity);

    resolveManager(managerFor({ findOne: jest.fn().mockResolvedValue(null) }));
    const missing = await repository.updatePartial(obraEntity);
    expect(missing.isLeft()).toBe(true);
    expect(missing.value).toMatchObject({
      code: ErrorCodeConstants.OBRA_NOT_FOUND,
      statusCode: 404,
    });
  });

  it('soft deletes through TypeORM and maps unexpected failures', async () => {
    const update = jest.fn().mockResolvedValue({ affected: 1 });
    resolveManager(managerFor({ update }));
    const deleted = await repository.softDelete('obra-1');
    expect(deleted.isRight()).toBe(true);
    expect(update).toHaveBeenCalledWith(
      { id: 'obra-1', deletedAt: expect.anything() },
      { deletedAt: expect.any(Date), updatedAt: expect.any(Date) },
    );

    const cause = new Error('write failed');
    resolveManager(managerFor({ update: jest.fn().mockRejectedValue(cause) }));
    const failed = await repository.softDelete('obra-1');
    expect(failed.isLeft()).toBe(true);
    expect(failed.value).toMatchObject({
      code: ErrorCodeConstants.OBRA_REPOSITORY_FAILED,
      cause,
    });
  });
});
