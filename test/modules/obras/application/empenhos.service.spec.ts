import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { left, right } from '@/core/types/either';
import IEmpenhoRepository from '@/modules/obras/adapters/empenho_repository.interface';
import IObraRepository from '@/modules/obras/adapters/obra_repository.interface';
import EmpenhosService from '@/modules/obras/application/empenhos.service';
import EmpenhoEntity from '@/modules/obras/domain/entities/empenho.entity';
import { TipoEmpenho } from '@/modules/obras/domain/enums/tipo_empenho.enum';
import IFonteRepository from '@/modules/fontes/adapters/fonte_repository.interface';

describe('EmpenhosService', () => {
  const tc = { require: jest.fn(() => ({ tenantId: 't1', schemaName: 'tenant_1' })) };
  const repos = () => ({
    empenho: { save: jest.fn(), findById: jest.fn(), listByObra: jest.fn(), sumLiquidado: jest.fn(), delete: jest.fn() } as unknown as jest.Mocked<IEmpenhoRepository>,
    obra: { findById: jest.fn() } as unknown as jest.Mocked<IObraRepository>,
    fonte: { findById: jest.fn() } as unknown as jest.Mocked<IFonteRepository>,
  });

  const param = { obraId: 'o1', fonteId: 'f1', tipo: TipoEmpenho.ORDINARIO, numero: '001', dataEmpenho: '2026-01-10', valor: 1000 };

  it('creates an empenho when obra and fonte are valid', async () => {
    const r = repos();
    r.obra.findById.mockResolvedValue(right({} as never));
    r.fonte.findById.mockResolvedValue(right({ ativo: true } as never));
    r.empenho.save.mockImplementation(async (e) => right(e));
    const svc = new EmpenhosService(r.empenho, r.obra, r.fonte, tc as never);

    const result = await svc.create(param);

    expect(result.isRight()).toBe(true);
    expect(r.empenho.save).toHaveBeenCalledWith(expect.any(EmpenhoEntity));
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
    r.fonte.findById.mockResolvedValue(right({ ativo: true } as never));
    const svc = new EmpenhosService(r.empenho, r.obra, r.fonte, tc as never);

    const result = await svc.create({ ...param, valor: 0 });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) expect(result.value.code).toBe(ErrorCodeConstants.EMPENHO_INVALID_VALOR);
  });
});
