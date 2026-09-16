import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { right } from '@/core/types/either';
import IEmpenhoRepository from '@/modules/obras/adapters/empenho_repository.interface';
import ILiquidacaoRepository from '@/modules/obras/adapters/liquidacao_repository.interface';
import LiquidacoesService from '@/modules/obras/application/liquidacoes.service';
import LiquidacaoEntity from '@/modules/obras/domain/entities/liquidacao.entity';
import IFonteRepository from '@/modules/fontes/adapters/fonte_repository.interface';

describe('LiquidacoesService', () => {
  const tc = { require: jest.fn(() => ({ tenantId: 't1', schemaName: 'tenant_1' })) };
  const repos = () => ({
    repo: { save: jest.fn(), findById: jest.fn(), listByObra: jest.fn(), sumPago: jest.fn(), delete: jest.fn() } as unknown as jest.Mocked<ILiquidacaoRepository>,
    empenho: { findById: jest.fn(), sumLiquidado: jest.fn() } as unknown as jest.Mocked<IEmpenhoRepository>,
    fonte: { findById: jest.fn() } as unknown as jest.Mocked<IFonteRepository>,
  });

  const param = { obraId: 'o1', empenhoId: 'e1', fonteId: 'f1', numero: '001', dataLiquidacao: '2026-02-10', valor: 400 };

  it('creates a liquidacao within the empenho ceiling', async () => {
    const r = repos();
    r.fonte.findById.mockResolvedValue(right({ ativo: true } as never));
    r.empenho.findById.mockResolvedValue(right({ valor: 1000, obraId: 'o1' } as never));
    r.empenho.sumLiquidado.mockResolvedValue(right(100));
    r.repo.save.mockImplementation(async (e) => right(e));
    const svc = new LiquidacoesService(r.repo, r.empenho, r.fonte, tc as never);

    const result = await svc.create(param);

    expect(result.isRight()).toBe(true);
    expect(r.repo.save).toHaveBeenCalledWith(expect.any(LiquidacaoEntity));
  });

  it('rejects liquidacao exceeding the empenho valor (RN-FIN-09)', async () => {
    const r = repos();
    r.fonte.findById.mockResolvedValue(right({ ativo: true } as never));
    r.empenho.findById.mockResolvedValue(right({ valor: 1000, obraId: 'o1' } as never));
    r.empenho.sumLiquidado.mockResolvedValue(right(700));
    const svc = new LiquidacoesService(r.repo, r.empenho, r.fonte, tc as never);

    const result = await svc.create(param);

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) expect(result.value.code).toBe(ErrorCodeConstants.LIQUIDACAO_EXCEDE_EMPENHO);
    expect(r.repo.save).not.toHaveBeenCalled();
  });
});
