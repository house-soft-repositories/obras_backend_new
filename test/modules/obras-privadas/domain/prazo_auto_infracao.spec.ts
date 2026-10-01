import {
  AndamentoObraPrivada,
  SituacaoAutoInfracao,
  TipoAutoInfracao,
} from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';
import {
  andamentoAposAuto,
  AutoResumo,
  calcularDataLimite,
  contarPrazo,
  estaAutuada,
  estaEmbargada,
} from '@/modules/obras-privadas/domain/prazo_auto_infracao';

const HOJE = '2026-08-11';

function auto(over: Partial<AutoResumo> = {}): AutoResumo {
  return {
    tipo: TipoAutoInfracao.NOTIFICACAO,
    situacao: SituacaoAutoInfracao.ABERTO,
    dataLimite: null,
    ...over,
  };
}

describe('prazo e efeitos do auto de infracao (RN-PRV-11/12)', () => {
  describe('calcularDataLimite', () => {
    it('soma o prazo em dias corridos', () => {
      expect(calcularDataLimite('2026-05-19', 15)).toBe('2026-06-03');
      expect(calcularDataLimite('2026-08-02', 20)).toBe('2026-08-22');
    });

    it('atravessa virada de mes e de ano', () => {
      expect(calcularDataLimite('2026-12-20', 30)).toBe('2027-01-19');
    });

    it('nao pula fim de semana (diferente da regra de obra publica)', () => {
      expect(calcularDataLimite('2026-08-07', 2)).toBe('2026-08-09');
    });

    it('retorna null sem prazo informado', () => {
      expect(calcularDataLimite('2026-05-19', null)).toBeNull();
      expect(calcularDataLimite('2026-05-19', undefined)).toBeNull();
    });
  });

  describe('estaAutuada / estaEmbargada', () => {
    it('ABERTO e EM_RECURSO mantem a obra autuada', () => {
      expect(estaAutuada([auto({ situacao: SituacaoAutoInfracao.ABERTO })])).toBe(true);
      expect(
        estaAutuada([auto({ situacao: SituacaoAutoInfracao.EM_RECURSO })]),
      ).toBe(true);
    });

    it('CUMPRIDO, QUITADO e CANCELADO nao mantem a obra autuada', () => {
      expect(
        estaAutuada([
          auto({ situacao: SituacaoAutoInfracao.CUMPRIDO }),
          auto({ situacao: SituacaoAutoInfracao.QUITADO }),
          auto({ situacao: SituacaoAutoInfracao.CANCELADO }),
        ]),
      ).toBe(false);
    });

    it('so EMBARGO/INTERDICAO ABERTO deixam a obra embargada', () => {
      expect(
        estaEmbargada([auto({ tipo: TipoAutoInfracao.EMBARGO })]),
      ).toBe(true);
      expect(
        estaEmbargada([auto({ tipo: TipoAutoInfracao.INTERDICAO })]),
      ).toBe(true);
      expect(estaEmbargada([auto({ tipo: TipoAutoInfracao.MULTA })])).toBe(
        false,
      );
    });

    it('embargo em recurso nao mantem a obra embargada', () => {
      expect(
        estaEmbargada([
          auto({
            tipo: TipoAutoInfracao.EMBARGO,
            situacao: SituacaoAutoInfracao.EM_RECURSO,
          }),
        ]),
      ).toBe(false);
    });
  });

  describe('andamentoAposAuto (RN-PRV-12)', () => {
    it('embargo aberto forca PARALISADA', () => {
      expect(
        andamentoAposAuto(
          [auto({ tipo: TipoAutoInfracao.EMBARGO })],
          AndamentoObraPrivada.EM_ANDAMENTO,
        ),
      ).toBe(AndamentoObraPrivada.PARALISADA);
    });

    it('encerrar o ultimo embargo devolve a obra para EM_ANDAMENTO', () => {
      expect(
        andamentoAposAuto(
          [
            auto({
              tipo: TipoAutoInfracao.EMBARGO,
              situacao: SituacaoAutoInfracao.CUMPRIDO,
            }),
          ],
          AndamentoObraPrivada.PARALISADA,
        ),
      ).toBe(AndamentoObraPrivada.EM_ANDAMENTO);
    });

    it('nao ressuscita obra concluida, demolida ou cancelada', () => {
      for (const estado of [
        AndamentoObraPrivada.CONCLUIDA,
        AndamentoObraPrivada.DEMOLIDA,
        AndamentoObraPrivada.CANCELADA,
      ]) {
        expect(andamentoAposAuto([], estado)).toBe(estado);
      }
    });

    it('obra sem auto nenhum mantem o andamento atual', () => {
      expect(
        andamentoAposAuto([], AndamentoObraPrivada.NAO_INICIADA),
      ).toBe(AndamentoObraPrivada.NAO_INICIADA);
    });
  });

  describe('contarPrazo', () => {
    it('conta os dias restantes', () => {
      expect(contarPrazo(auto({ dataLimite: '2026-08-22' }), HOJE)).toEqual({
        dias: 11,
        vencido: false,
        rotulo: 'faltam 11 dias',
      });
    });

    it('marca vencido quando a data limite passou', () => {
      expect(contarPrazo(auto({ dataLimite: '2026-07-08' }), HOJE)).toEqual({
        dias: -34,
        vencido: true,
        rotulo: 'vencido ha 34 dias',
      });
    });

    it('auto cumprido ou quitado nunca aparece como vencido', () => {
      const cumprido = contarPrazo(
        auto({
          dataLimite: '2026-06-03',
          situacao: SituacaoAutoInfracao.CUMPRIDO,
        }),
        HOJE,
      );
      expect(cumprido.vencido).toBe(false);
      expect(cumprido.rotulo).toBe('no prazo');
    });

    it('auto sem prazo nao exibe contagem', () => {
      expect(contarPrazo(auto({ dataLimite: null }), HOJE)).toEqual({
        dias: null,
        vencido: false,
        rotulo: '',
      });
    });
  });
});
