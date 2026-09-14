import {
  avancarDiasContados,
  calcularPrazoFinalExecucao,
} from '@/modules/contratos/domain/calculo_prazo_execucao';
import {
  TipoAditivo,
  TipoPrazoExecucao,
} from '@/modules/contratos/domain/enums/contratos.enums';

describe('calculoPrazoExecucao', () => {
  it('skips weekends when advancing counted days', () => {
    expect(avancarDiasContados('2026-09-11', 1, false, false)).toBe(
      '2026-09-14',
    );
  });

  it('adds paused days and deadline amendments to the contract deadline', () => {
    const result = calcularPrazoFinalExecucao({
      dataOs: '2026-09-14',
      tipoPrazoExecucao: TipoPrazoExecucao.DIAS,
      prazoExecucaoDias: 10,
      prazoExecucaoData: null,
      paralisacoes: [
        {
          dataParalisacao: '2026-09-16',
          dataReinicio: '2026-09-19',
          diasParados: null,
        },
      ],
      aditivos: [
        {
          tipo: TipoAditivo.PRAZO,
          tipoPrazoExecucao: TipoPrazoExecucao.DIAS,
          prazoExecucaoDias: 5,
          prazoExecucaoData: null,
        },
      ],
      considerarSabado: true,
      considerarDomingo: true,
      dataReferencia: '2026-09-30',
    });

    expect(result).toMatchObject({
      diasBase: 10,
      diasParalisacoes: 3,
      diasAditivos: 5,
      totalDias: 18,
      prazoFinal: '2026-10-02',
    });
  });
});
