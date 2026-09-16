import ErrorCodeConstants from '@/core/constants/error_code.constants';
import EmpenhoEntity from '@/modules/obras/domain/entities/empenho.entity';
import LiquidacaoEntity from '@/modules/obras/domain/entities/liquidacao.entity';
import PagamentoEntity from '@/modules/obras/domain/entities/pagamento.entity';
import { TipoEmpenho } from '@/modules/obras/domain/enums/tipo_empenho.enum';

describe('ExecucaoOrcamentaria entities', () => {
  it('creates an empenho with valid input', () => {
    const e = EmpenhoEntity.create({
      tenantId: 't1', obraId: 'o1', fonteId: 'f1',
      tipo: TipoEmpenho.ORDINARIO, numero: '001', dataEmpenho: '2026-01-10', valor: 1000,
    });
    expect(e.valor).toBe(1000);
    expect(e.observacoes).toBeNull();
  });

  it('rejects empenho with non-positive valor', () => {
    expect(() =>
      EmpenhoEntity.create({
        tenantId: 't1', obraId: 'o1', fonteId: 'f1',
        tipo: TipoEmpenho.GLOBAL, numero: '001', dataEmpenho: '2026-01-10', valor: 0,
      }),
    ).toThrow(expect.objectContaining({ code: ErrorCodeConstants.EMPENHO_INVALID_VALOR }));
  });

  it('rejects liquidacao with non-positive valor', () => {
    expect(() =>
      LiquidacaoEntity.create({
        tenantId: 't1', empenhoId: 'e1', fonteId: 'f1',
        numero: '001', dataLiquidacao: '2026-02-10', valor: -5,
      }),
    ).toThrow(expect.objectContaining({ code: ErrorCodeConstants.LIQUIDACAO_INVALID_VALOR }));
  });

  it('rejects pagamento with non-positive valor', () => {
    expect(() =>
      PagamentoEntity.create({
        tenantId: 't1', empenhoId: 'e1', liquidacaoId: 'l1', fonteId: 'f1',
        numeroOrdemBancaria: 'OB-1', dataOrdemBancaria: '2026-03-10', valor: 0,
      }),
    ).toThrow(expect.objectContaining({ code: ErrorCodeConstants.PAGAMENTO_INVALID_VALOR }));
  });
});
