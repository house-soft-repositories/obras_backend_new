import {
  SituacaoAlvara,
  SituacaoRegistroAlvara,
} from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';
import {
  alvaraVigente,
  AlvaraResumo,
  derivarSituacaoAlvara,
  diasAteVencimento,
} from '@/modules/obras-privadas/domain/situacao_alvara';

const HOJE = '2026-08-11';

function alvara(over: Partial<AlvaraResumo> = {}): AlvaraResumo {
  return {
    id: 'a1',
    situacao: SituacaoRegistroAlvara.VIGENTE,
    dataEmissao: '2026-03-14',
    dataValidade: '2026-09-14',
    ...over,
  };
}

describe('situacao de alvara (RN-PRV-03/04/05)', () => {
  describe('alvaraVigente', () => {
    it('retorna null quando nao ha nenhum registro', () => {
      expect(alvaraVigente([])).toBeNull();
    });

    it('escolhe o VIGENTE de maior data de emissao', () => {
      const antigo = alvara({ id: 'antigo', dataEmissao: '2025-09-02' });
      const novo = alvara({ id: 'novo', dataEmissao: '2026-03-14' });
      expect(alvaraVigente([antigo, novo])?.id).toBe('novo');
    });

    it('ignora SUBSTITUIDO, VENCIDO e INDEFERIDO', () => {
      const registros = [
        alvara({ id: 's', situacao: SituacaoRegistroAlvara.SUBSTITUIDO }),
        alvara({ id: 'v', situacao: SituacaoRegistroAlvara.VENCIDO }),
        alvara({
          id: 'i',
          situacao: SituacaoRegistroAlvara.INDEFERIDO,
          dataEmissao: '2026-12-31',
        }),
      ];
      expect(alvaraVigente(registros)).toBeNull();
    });
  });

  describe('derivarSituacaoAlvara', () => {
    it('sem alvara vigente resulta em SEM_ALVARA', () => {
      expect(derivarSituacaoAlvara([], SituacaoAlvara.SEM_ALVARA, HOJE)).toBe(
        SituacaoAlvara.SEM_ALVARA,
      );
    });

    it('validade futura resulta em COM_ALVARA_VIGENTE', () => {
      expect(
        derivarSituacaoAlvara(
          [alvara({ dataValidade: '2026-09-14' })],
          SituacaoAlvara.SEM_ALVARA,
          HOJE,
        ),
      ).toBe(SituacaoAlvara.COM_ALVARA_VIGENTE);
    });

    it('validade passada resulta em COM_ALVARA_VENCIDO', () => {
      expect(
        derivarSituacaoAlvara(
          [alvara({ dataValidade: '2026-03-01' })],
          SituacaoAlvara.COM_ALVARA_VIGENTE,
          HOJE,
        ),
      ).toBe(SituacaoAlvara.COM_ALVARA_VENCIDO);
    });

    it('vence somente no dia seguinte ao da validade', () => {
      expect(
        derivarSituacaoAlvara(
          [alvara({ dataValidade: HOJE })],
          SituacaoAlvara.SEM_ALVARA,
          HOJE,
        ),
      ).toBe(SituacaoAlvara.COM_ALVARA_VIGENTE);
    });

    it('alvara sem data de validade nao vence', () => {
      expect(
        derivarSituacaoAlvara(
          [alvara({ dataValidade: null })],
          SituacaoAlvara.SEM_ALVARA,
          HOJE,
        ),
      ).toBe(SituacaoAlvara.COM_ALVARA_VIGENTE);
    });

    it('DISPENSADA e marcacao manual e nunca e sobrescrita', () => {
      expect(
        derivarSituacaoAlvara([], SituacaoAlvara.DISPENSADA, HOJE),
      ).toBe(SituacaoAlvara.DISPENSADA);
      expect(
        derivarSituacaoAlvara(
          [alvara({ dataValidade: '2026-09-14' })],
          SituacaoAlvara.DISPENSADA,
          HOJE,
        ),
      ).toBe(SituacaoAlvara.DISPENSADA);
    });

    it('pedido indeferido nao muda a situacao da obra (RN-PRV-05)', () => {
      const indeferido = alvara({
        situacao: SituacaoRegistroAlvara.INDEFERIDO,
        dataEmissao: null,
        dataValidade: null,
      });
      expect(
        derivarSituacaoAlvara([indeferido], SituacaoAlvara.SEM_ALVARA, HOJE),
      ).toBe(SituacaoAlvara.SEM_ALVARA);
    });
  });

  describe('diasAteVencimento', () => {
    it('conta os dias restantes', () => {
      expect(diasAteVencimento('2026-09-14', HOJE)).toBe(34);
    });

    it('retorna negativo quando ja venceu', () => {
      expect(diasAteVencimento('2026-08-01', HOJE)).toBe(-10);
    });

    it('retorna null sem data de validade', () => {
      expect(diasAteVencimento(null, HOJE)).toBeNull();
    });
  });
});
