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

type MockManager = {
  query: jest.Mock<Promise<{ id: string }[]>, [string, unknown[]?]>;
};

type MockDataSource = Pick<DataSource, 'transaction'> & {
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
  ({ findLastCodigo: jest.fn(), save: jest.fn() }) as unknown as jest.Mocked<IObraRepository>;

const makeFonteRepo = (): jest.Mocked<IFonteRepository> =>
  ({ findById: jest.fn(), findByCodigo: jest.fn(), save: jest.fn(), findAll: jest.fn() });

const makeDS = (): MockDataSource => {
  const mockManager = { query: jest.fn().mockResolvedValue([{ id: 'obra-1' }]) };
  return {
    transaction: jest.fn(async (cb: (m: MockManager) => Promise<unknown>) => {
      const result = await cb(mockManager);
      return result;
    }) as unknown as DataSource['transaction'],
    mockManager,
  };
};

const makeTC = (schema = 'tenant_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa') =>
  ({ require: () => ({ schemaName: schema }) }) as unknown as TenantContext;

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
    const svc = new CreateObraService(obraRepo, fonteRepo, ds as DataSource, tc, makeEvents());
    const result = await svc.execute(baseParam);
    expect(result.isRight()).toBe(true);
    expect(result.getOrThrow().codigo).toMatch(/^OBR-\d{4}-0001$/);
    expect(ds.transaction).toHaveBeenCalledTimes(1);
    expect(ds.mockManager.query).toHaveBeenCalledWith(
      expect.stringContaining('"obra_orcamento_previsto"'),
      expect.any(Array),
    );
  });

  it('rejects when orcamentos empty', async () => {
    const svc = new CreateObraService(makeObraRepo(), makeFonteRepo(), makeDS(), makeTC(), makeEvents());
    const result = await svc.execute({ ...baseParam, orcamentos: [] });
    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(ErrorCodeConstants.OBRA_INVALID_ORCAMENTO);
  });

  it('rejects invalid subclassificacao/type combination', async () => {
    const svc = new CreateObraService(makeObraRepo(), makeFonteRepo(), makeDS(), makeTC(), makeEvents());
    const result = await svc.execute({ ...baseParam, tipo: 'REFORMA', subclassificacaoId: 'sub-1' });
    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(ErrorCodeConstants.OBRA_INVALID_SUBCLASSIFICACAO);
  });

  it('rejects when fonte not found or inactive', async () => {
    const obraRepo = makeObraRepo();
    const fonteRepo = makeFonteRepo();
    fonteRepo.findById.mockResolvedValue(right(null));
    const svc = new CreateObraService(obraRepo, fonteRepo, makeDS(), makeTC(), makeEvents());
    const result = await svc.execute(baseParam);
    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(ErrorCodeConstants.OBRA_FONTE_INATIVA);
    expect(result.value.statusCode).toBe(422);
  });

  it('retries code generation on unique collision and succeeds', async () => {
    const obraRepo = makeObraRepo();
    obraRepo.findLastCodigo.mockResolvedValueOnce(right('OBR-2026-0001')).mockResolvedValueOnce(right('OBR-2026-0001'));
    const fonteRepo = makeFonteRepo();
    const fonte = makeFonte();
    fonteRepo.findById.mockResolvedValue(right(fonte));
    obraRepo.findLastCodigo.mockResolvedValue(right(null));
    const collision = Object.assign(new Error('codigo duplicado'), {
      code: '23505',
      constraint: 'UQ_obras_codigo',
    });
    const ds2 = {
      transaction: jest.fn().mockRejectedValue(collision),
    } as unknown as DataSource;
    const svc2 = new CreateObraService(obraRepo, fonteRepo, ds2, makeTC(), makeEvents());
    const result = await svc2.execute(baseParam);
    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(ErrorCodeConstants.OBRA_DUPLICATE_CODIGO);
  });
});
