import { StatusObra } from '@/modules/obras/domain/enums/status_obra.enum';
import { SemaforoDesempenho } from '@/modules/relatorios/domain/enums/relatorios.enum';
import {
  agregarQuantificadores,
  classificarSemaforo,
  computarDesempenhoObra,
} from '@/modules/relatorios/domain/logic/desempenho.logic';

describe('desempenho relatorios logic', () => {
  it('classifies semaphore using tolerance', () => {
    expect(classificarSemaforo(50, 55, 2)).toBe(SemaforoDesempenho.VERDE);
    expect(classificarSemaforo(50, 48, 2)).toBe(SemaforoDesempenho.LARANJA);
    expect(classificarSemaforo(50, 47, 2)).toBe(SemaforoDesempenho.VERMELHO);
  });

  it('computes average planned and actual performance', () => {
    const desempenho = computarDesempenhoObra({
      status: StatusObra.EM_DESENVOLVIMENTO,
      prazoConclusao: '2026-01-01',
      dataReferencia: '2026-02-01',
      estagiosRaiz: [
        { percentualRealizado: 40, metaAtual: 50 },
        { percentualRealizado: 60, metaAtual: 70 },
      ],
    });

    expect(desempenho).toEqual({
      percentualPrevisto: 60,
      percentualRealizado: 50,
      semaforo: SemaforoDesempenho.VERMELHO,
      prazoVencido: true,
    });
  });

  it('aggregates mutually exclusive quantifier buckets', () => {
    const quantificadores = agregarQuantificadores([
      {
        status: StatusObra.EM_DESENVOLVIMENTO,
        desempenho: {
          percentualPrevisto: 10,
          percentualRealizado: 15,
          semaforo: SemaforoDesempenho.VERDE,
          prazoVencido: false,
        },
      },
      {
        status: StatusObra.EM_DESENVOLVIMENTO,
        desempenho: {
          percentualPrevisto: 80,
          percentualRealizado: 10,
          semaforo: SemaforoDesempenho.VERMELHO,
          prazoVencido: false,
        },
      },
      {
        status: StatusObra.EM_ABERTO,
        desempenho: {
          percentualPrevisto: 0,
          percentualRealizado: 0,
          semaforo: null,
          prazoVencido: false,
        },
      },
    ]);

    expect(quantificadores).toEqual({
      acimaMeta: 1,
      prazoVencido: 0,
      abaixoMeta: 1,
      semStatus: 1,
      totalObras: 3,
    });
  });
});
