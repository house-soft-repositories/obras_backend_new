import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { right } from '@/core/types/either';
import IEmpenhoRepository from '@/modules/obras/adapters/empenho_repository.interface';
import ILiquidacaoRepository from '@/modules/obras/adapters/liquidacao_repository.interface';
import IObraRepository from '@/modules/obras/adapters/obra_repository.interface';
import IPagamentoRepository from '@/modules/obras/adapters/pagamento_repository.interface';
import PagamentosService from '@/modules/obras/application/pagamentos.service';
import PagamentoEntity from '@/modules/obras/domain/entities/pagamento.entity';
import IFonteRepository from '@/modules/fontes/adapters/fonte_repository.interface';

describe('PagamentosService', () => {
  const tc = { require: jest.fn(() => ({ tenantId: 't1', schemaName: 'tenant_1' })) };
  const repos = (medicaoRows: unknown[] = [{ '1': 1 }]) => ({
    repo: {
      save: jest.fn(),
      findById: jest.fn(),
      findByIdWithFonte: jest.fn(),
      listByObra: jest.fn(),
      listByObraWithFonte: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<IPagamentoRepository>,
    empenho: { findById: jest.fn() } as unknown as jest.Mocked<IEmpenhoRepository>,
    liquidacao: { findById: jest.fn(), sumPago: jest.fn() } as unknown as jest.Mocked<ILiquidacaoRepository>,
    obra: { findById: jest.fn() } as unknown as jest.Mocked<IObraRepository>,
    fonte: { findById: jest.fn() } as unknown as jest.Mocked<IFonteRepository>,
    ds: { query: jest.fn().mockResolvedValue(medicaoRows) },
  });

  const fonteAtiva = { id: 'f1', nome: 'Fonte Tesouro', valorPrevisto: '10000.00', ativo: true };
  const param = {
    obraId: 'o1', empenhoId: 'e1', liquidacaoId: 'l1', fonteId: 'f1',
    numeroOrdemBancaria: 'OB-1', dataOrdemBancaria: '2026-03-10', valor: 200,
  };

  const valid = (r: ReturnType<typeof repos>, vincular = false) => {
    r.fonte.findById.mockResolvedValue(right(fonteAtiva as never));
    r.obra.findById.mockResolvedValue(right({ vincularPagamentoPercentual: vincular } as never));
    r.empenho.findById.mockResolvedValue(right({ obraId: 'o1' } as never));
    r.liquidacao.findById.mockResolvedValue(right({ empenhoId: 'e1', valor: 400 } as never));
    r.liquidacao.sumPago.mockResolvedValue(right(100));
    r.repo.save.mockImplementation(async (e) => right(e));
  };

  it('creates a pagamento within the liquidacao ceiling', async () => {
    const r = repos();
    valid(r);
    const svc = new PagamentosService(r.repo, r.empenho, r.liquidacao, r.obra, r.fonte, r.ds as never, tc as never);

    const result = await svc.create(param);

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      // create agora devolve objeto com fonte (id, nome, valorPrevisto)
      expect(result.value.pagamento).not.toBeInstanceOf(PagamentoEntity);
      expect(result.value.pagamento.fonte).toEqual({ id: 'f1', nome: 'Fonte Tesouro', valorPrevisto: '10000.00' });
      expect(result.value.alerta).toBeUndefined();
    }
  });

  it('blocks pagamento without medicao when the obra requires it (RN-FIN-07)', async () => {
    const r = repos([]);
    valid(r, true);
    const svc = new PagamentosService(r.repo, r.empenho, r.liquidacao, r.obra, r.fonte, r.ds as never, tc as never);

    const result = await svc.create(param);

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) expect(result.value.code).toBe(ErrorCodeConstants.PAGAMENTO_SEM_MEDICAO);
    expect(r.repo.save).not.toHaveBeenCalled();
  });

  it('returns an alerta when medicao is missing but not required', async () => {
    const r = repos([]);
    valid(r, false);
    const svc = new PagamentosService(r.repo, r.empenho, r.liquidacao, r.obra, r.fonte, r.ds as never, tc as never);

    const result = await svc.create(param);

    expect(result.isRight()).toBe(true);
    if (result.isRight()) expect(result.value.alerta).toBeDefined();
  });

  it('rejects pagamento exceeding the liquidacao valor (RN-FIN-09)', async () => {
    const r = repos();
    valid(r);
    r.liquidacao.sumPago.mockResolvedValue(right(300));
    const svc = new PagamentosService(r.repo, r.empenho, r.liquidacao, r.obra, r.fonte, r.ds as never, tc as never);

    const result = await svc.create(param);

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) expect(result.value.code).toBe(ErrorCodeConstants.PAGAMENTO_EXCEDE_LIQUIDACAO);
  });

  it('lists pagamentos with fonte via a single JOIN query (no N+1)', async () => {
    const r = repos();
    const rows = [
      { id: 'p1', empenhoId: 'e1', fonteId: 'f1', fonte: { id: 'f1', nome: 'Fonte Tesouro', valorPrevisto: '10000.00' } },
    ];
    r.repo.listByObraWithFonte.mockResolvedValue(right(rows as never));
    const svc = new PagamentosService(r.repo, r.empenho, r.liquidacao, r.obra, r.fonte, r.ds as never, tc as never);

    const result = await svc.list('o1');

    expect(result.isRight()).toBe(true);
    expect(r.repo.listByObraWithFonte).toHaveBeenCalledWith('o1');
    expect(r.fonte.findById).not.toHaveBeenCalled();
    if (result.isRight()) expect(result.value[0].fonte?.nome).toBe('Fonte Tesouro');
  });
});
