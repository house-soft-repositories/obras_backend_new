import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AditivoEntity from '@/modules/contratos/domain/entities/aditivo.entity';
import ParalisacaoEntity from '@/modules/contratos/domain/entities/paralisacao.entity';
import {
  TipoAditivo,
  TipoPrazoExecucao,
} from '@/modules/contratos/domain/enums/contratos.enums';
import AditivoDomainException from '@/modules/contratos/exceptions/aditivo_domain.exception';
import ParalisacaoDomainException from '@/modules/contratos/exceptions/paralisacao_domain.exception';

describe('AditivoEntity', () => {
  const base = {
    tenantId: 'tenant-1',
    contratoId: 'contrato-1',
    numero: ' AD-001 ',
    tipo: TipoAditivo.PRAZO,
    tipoPrazoExecucao: TipoPrazoExecucao.DIAS,
    prazoExecucaoDias: 15,
  };

  it('creates prazo aditivo with normalized number', () => {
    const aditivo = AditivoEntity.create(base);

    expect(aditivo.id).toEqual(expect.any(String));
    expect(aditivo.numero).toBe('AD-001');
    expect(aditivo.tipoPrazoExecucao).toBe(TipoPrazoExecucao.DIAS);
    expect(aditivo.prazoExecucaoDias).toBe(15);
  });

  it.each([
    [{ ...base, numero: ' ' }],
    [{ ...base, tipoPrazoExecucao: null }],
    [{ ...base, prazoExecucaoDias: 0 }],
    [{ ...base, tipoPrazoExecucao: TipoPrazoExecucao.DATA, prazoExecucaoDias: null, prazoExecucaoData: null }],
    [{ ...base, tipo: TipoAditivo.VALOR, tipoPrazoExecucao: null, prazoExecucaoDias: null, fontes: [{ fonteId: 'fonte-1', valor: '0' }] }],
  ])('rejects invalid aditivo input', (props) => {
    expect.assertions(2);

    try {
      AditivoEntity.create(props);
    } catch (error) {
      expect(error).toBeInstanceOf(AditivoDomainException);
      expect((error as AditivoDomainException).code).toBe(
        ErrorCodeConstants.ADITIVO_INVALID_INPUT,
      );
    }
  });
});

describe('ParalisacaoEntity', () => {
  const base = {
    tenantId: 'tenant-1',
    contratoId: 'contrato-1',
    dataParalisacao: '2026-09-01',
    motivo: 'Aguardando insumo',
    termoParalisacaoArquivoId: '550e8400-e29b-41d4-a716-446655440000',
  };

  it('calculates stopped days on reinicio', () => {
    const paralisacao = ParalisacaoEntity.create(base);

    paralisacao.reiniciar('2026-09-11', '550e8400-e29b-41d4-a716-446655440001');

    expect(paralisacao.dataReinicio).toBe('2026-09-11');
    expect(paralisacao.diasParados).toBe(10);
    expect(paralisacao.toObject().termoRetomadaArquivoId).toBe(
      '550e8400-e29b-41d4-a716-446655440001',
    );
  });

  it('rejects reinicio before data paralisacao', () => {
    const paralisacao = ParalisacaoEntity.create(base);

    expect(() => paralisacao.reiniciar('2026-08-31')).toThrow(
      ParalisacaoDomainException,
    );
  });
});
