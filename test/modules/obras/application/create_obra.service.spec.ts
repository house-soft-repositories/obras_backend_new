import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { right } from '@/core/types/either';
import CreateObraService from '@/modules/obras/application/create_obra.service';
import FonteEntity from '@/modules/fontes/domain/entities/fonte.entity';
import type IFonteRepository from '@/modules/fontes/adapters/fonte_repository.interface';
import type IObraRepository from '@/modules/obras/adapters/obra_repository.interface';
import type { DataSource } from 'typeorm';
import type TenantContext from '@/core/multitenancy/tenant_context';
import type ObraEventsService from '@/modules/obras/events/obra_events.service';
import type { CreateObraParam } from '@/modules/obras/domain/usecase/create_obra.usecase';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import type IUserRepository from '@/modules/users/adapters/user_repository.interface';

type MockRepository = {
  create: jest.Mock;
  save: jest.Mock;
};

type MockManager = {
  getRepository: jest.Mock<MockRepository>;
};

type MockDataSource = Pick<DataSource, 'createQueryRunner'> & {
  mockManager: MockManager;
};

const makeFonte = () =>
  FonteEntity.create({
    nome: 'Fonte A',
    descricao: null,
    codigo: 'F-001',
    tipo: null,
    valorPrevisto: null,
    vigencia: null,
  });

const makeObraRepo = (): jest.Mocked<IObraRepository> =>
  ({
    findLastCodigo: jest.fn(),
    save: jest.fn(),
  }) as unknown as jest.Mocked<IObraRepository>;

const makeFonteRepo = (): jest.Mocked<IFonteRepository> => ({
  findById: jest.fn(),
  findByCodigo: jest.fn(),
  save: jest.fn(),
  findAll: jest.fn(),
});

const makeDS = (): MockDataSource => {
  const repositories = new Map<string, MockRepository>();
  const getRepository = jest.fn((model: { name: string }) => {
    if (!repositories.has(model.name))
      repositories.set(model.name, {
        create: jest.fn((data) => data),
        save: jest.fn(async (data) =>
          Array.isArray(data) ? data : { id: data.id ?? 'obra-1', ...data },
        ),
      });
    return repositories.get(model.name);
  });
  const mockManager = { getRepository };
  const queryRunner = {
    manager: mockManager,
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    query: jest.fn(),
    isTransactionActive: true,
    isReleased: false,
  };
  return {
    createQueryRunner: jest.fn(() => queryRunner),
    mockManager,
  } as unknown as MockDataSource;
};

const makeTC = (schema = 'tenant_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa') =>
  ({
    require: () => ({ schemaName: schema, tenantId: 't1' }),
  }) as unknown as TenantContext;

const makeUserRepo = (): jest.Mocked<IUserRepository> =>
  ({
    findById: jest
      .fn()
      .mockResolvedValue(
        right({ role: UserRole.STAFF, tenantId: 't1' } as never),
      ),
  }) as unknown as jest.Mocked<IUserRepository>;

const makeEvents = () =>
  ({
    emitirObraCriada: jest.fn(),
    emitirObraDuplicada: jest.fn(),
  }) as unknown as ObraEventsService;

describe('CreateObraService', () => {
  const baseParam: CreateObraParam = {
    tenantId: 't1',
    nome: 'Reforma Escola',
    tipo: 'OBRA',
    orgaoId: 'org-1',
    responsavelUsuarioId: 'resp-1',
    criadoPorUsuarioId: 'user-1',
    orcamentos: [{ fonteId: 'fonte-1', valor: '10000.00' }],
    descricao: 'Desc',
  };

  it('creates obra with generated OBR code and persists responsible and orcamentos', async () => {
    const obraRepo = makeObraRepo();
    obraRepo.findLastCodigo.mockResolvedValue(right(null));
    const fonteRepo = makeFonteRepo();
    const fonte = makeFonte();
    fonteRepo.findById.mockResolvedValue(right(fonte));
    const ds = makeDS();
    const tc = makeTC();
    const svc = new CreateObraService(
      obraRepo,
      fonteRepo,
      ds as DataSource,
      tc,
      makeEvents(),
      makeUserRepo(),
    );
    const result = await svc.execute(baseParam);
    expect(result.isRight()).toBe(true);
    expect(result.getOrThrow().codigo).toMatch(/^OBR-\d{4}-0001$/);
    expect(ds.createQueryRunner).toHaveBeenCalledTimes(1);
  });

  it('rejects when orcamentos empty', async () => {
    const svc = new CreateObraService(
      makeObraRepo(),
      makeFonteRepo(),
      makeDS(),
      makeTC(),
      makeEvents(),
      makeUserRepo(),
    );
    const result = await svc.execute({ ...baseParam, orcamentos: [] });
    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(ErrorCodeConstants.OBRA_INVALID_ORCAMENTO);
  });

  it('rejects invalid subclassificacao/type combination', async () => {
    const svc = new CreateObraService(
      makeObraRepo(),
      makeFonteRepo(),
      makeDS(),
      makeTC(),
      makeEvents(),
      makeUserRepo(),
    );
    const result = await svc.execute({
      ...baseParam,
      tipo: 'REFORMA',
      subclassificacaoId: 'sub-1',
    });
    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(
      ErrorCodeConstants.OBRA_INVALID_SUBCLASSIFICACAO,
    );
  });

  it('rejects when fonte not found or inactive', async () => {
    const obraRepo = makeObraRepo();
    const fonteRepo = makeFonteRepo();
    fonteRepo.findById.mockResolvedValue(right(null));
    const svc = new CreateObraService(
      obraRepo,
      fonteRepo,
      makeDS(),
      makeTC(),
      makeEvents(),
      makeUserRepo(),
    );
    const result = await svc.execute(baseParam);
    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(ErrorCodeConstants.OBRA_FONTE_INATIVA);
    expect(result.value.statusCode).toBe(422);
  });

  it('retries code generation on unique collision and succeeds', async () => {
    const obraRepo = makeObraRepo();
    obraRepo.findLastCodigo
      .mockResolvedValueOnce(right('OBR-2026-0001'))
      .mockResolvedValueOnce(right('OBR-2026-0001'));
    const fonteRepo = makeFonteRepo();
    const fonte = makeFonte();
    fonteRepo.findById.mockResolvedValue(right(fonte));
    obraRepo.findLastCodigo.mockResolvedValue(right(null));
    const collision = Object.assign(new Error('codigo duplicado'), {
      code: '23505',
      constraint: 'UQ_obras_codigo',
    });
    const ds2 = {
      createQueryRunner: jest.fn(() => {
        throw collision;
      }),
    } as unknown as DataSource;
    const svc2 = new CreateObraService(
      obraRepo,
      fonteRepo,
      ds2,
      makeTC(),
      makeEvents(),
      makeUserRepo(),
    );
    const result = await svc2.execute(baseParam);
    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(ErrorCodeConstants.OBRA_DUPLICATE_CODIGO);
  });
});
