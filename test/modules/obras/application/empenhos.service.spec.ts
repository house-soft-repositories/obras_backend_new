import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { right } from '@/core/types/either';
import IEmpenhoRepository from '@/modules/obras/adapters/empenho_repository.interface';
import IObraRepository from '@/modules/obras/adapters/obra_repository.interface';
import EmpenhosService from '@/modules/obras/application/empenhos.service';
import EmpenhoEntity from '@/modules/obras/domain/entities/empenho.entity';
import { TipoEmpenho } from '@/modules/obras/domain/enums/tipo_empenho.enum';
import IFonteRepository from '@/modules/fontes/adapters/fonte_repository.interface';

describe('EmpenhosService', () => {
  const tc = { require: jest.fn(() => ({ tenantId: 't1', schemaName: 'tenant_1' })) };
  const repos = () => ({
    empenho: {
      save: jest.fn(),
      findById: jest.fn(),
      findByIdWithFonte: jest.fn(),
      listByObra: jest.fn(),
      listByObraWithFonte: jest.fn(),
      sumLiquidado: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<IEmpenhoRepository>,
    obra: { findById: jest.fn() } as unknown as jest.Mocked<IObraRepository>,
    fonte: { findById: jest.fn() } as unknown as jest.Mocked<IFonteRepository>,
  });

  const fonteAtiva = { id: 'f1', nome: 'Fonte Tesouro', valorPrevisto: '10000.00', ativo: true };
  const param = { obraId: 'o1', fonteId: 'f1', tipo: TipoEmpenho.ORDINARIO, numero: '001', dataEmpenho: '2026-01-10', valor: 1000 };

  it('creates an empenho when obra and fonte are valid', async () => {
    const r = repos();
    r.obra.findById.mockResolvedValue(right({} as never));
    r.fonte.findById.mockResolvedValue(right(fonteAtiva as never));
    r.empenho.save.mockImplementation(async (e) => right(e));
    const svc = new EmpenhosService(r.empenho, r.obra, r.fonte, tc as never);

    const result = await svc.create(param);

    expect(result.isRight()).toBe(true);
    expect(r.empenho.save).toHaveBeenCalledWith(expect.any(EmpenhoEntity));
    if (result.isRight()) {
      // create monta o resumo da fonte validada sem query extra
      expect(result.value.fonte).toEqual({ id: 'f1', nome: 'Fonte Tesouro', valorPrevisto: '10000.00' });
      expect(result.value.fonteId).toBe('f1');
    }
  });

  it('returns 404 when obra is missing', async () => {
    const r = repos();
    r.obra.findById.mockResolvedValue(right(null));
    const svc = new EmpenhosService(r.empenho, r.obra, r.fonte, tc as never);

    const result = await svc.create(param);

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) expect(result.value.code).toBe(ErrorCodeConstants.OBRA_NOT_FOUND);
    expect(r.empenho.save).not.toHaveBeenCalled();
  });

  it('rejects inactive fonte with 422', async () => {
    const r = repos();
    r.obra.findById.mockResolvedValue(right({} as never));
    r.fonte.findById.mockResolvedValue(right({ ativo: false } as never));
    const svc = new EmpenhosService(r.empenho, r.obra, r.fonte, tc as never);

    const result = await svc.create(param);

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) expect(result.value.code).toBe(ErrorCodeConstants.FONTE_INATIVA);
  });

  it('rejects valor <= 0 coming from the boundary', async () => {
    const r = repos();
    r.obra.findById.mockResolvedValue(right({} as never));
    r.fonte.findById.mockResolvedValue(right(fonteAtiva as never));
    const svc = new EmpenhosService(r.empenho, r.obra, r.fonte, tc as never);

    const result = await svc.create({ ...param, valor: 0 });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) expect(result.value.code).toBe(ErrorCodeConstants.EMPENHO_INVALID_VALOR);
  });

  it('lists empenhos with fonte via a single JOIN query (no N+1)', async () => {
    const r = repos();
    r.obra.findById.mockResolvedValue(right({} as never));
    const rows = [
      { id: 'e1', fonteId: 'f1', fonte: { id: 'f1', nome: 'Fonte Tesouro', valorPrevisto: '10000.00' } },
    ];
    r.empenho.listByObraWithFonte.mockResolvedValue(right(rows as never));
    const svc = new EmpenhosService(r.empenho, r.obra, r.fonte, tc as never);

    const result = await svc.list('o1');

    expect(result.isRight()).toBe(true);
    expect(r.empenho.listByObraWithFonte).toHaveBeenCalledWith('o1');
    // Nenhuma busca individual de fonte por linha
    expect(r.fonte.findById).not.toHaveBeenCalled();
    if (result.isRight()) expect(result.value[0].fonte).toEqual(rows[0].fonte);
  });

  it('gets an empenho with fonte via a single JOIN query', async () => {
    const r = repos();
    const row = { id: 'e1', obraId: 'o1', fonteId: 'f1', fonte: { id: 'f1', nome: 'Fonte Tesouro', valorPrevisto: '10000.00' } };
    r.empenho.findByIdWithFonte.mockResolvedValue(right(row as never));
    const svc = new EmpenhosService(r.empenho, r.obra, r.fonte, tc as never);

    const result = await svc.get('o1', 'e1');

    expect(result.isRight()).toBe(true);
    expect(r.empenho.findByIdWithFonte).toHaveBeenCalledWith('e1');
    expect(r.fonte.findById).not.toHaveBeenCalled();
    if (result.isRight()) expect(result.value.fonte?.nome).toBe('Fonte Tesouro');
  });
});
