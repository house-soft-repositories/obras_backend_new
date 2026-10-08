import {
  CHROMIUM_NAO_ENCONTRADO,
  isChromiumIndisponivel,
} from '@/modules/relatorios/infra/reporting/chromium_erro';

describe('chromium_erro', () => {
  it('reconhece o erro de Chromium ausente', () => {
    expect(isChromiumIndisponivel(new Error(CHROMIUM_NAO_ENCONTRADO))).toBe(
      true,
    );
  });

  it('ignora outros erros e não-erros', () => {
    expect(isChromiumIndisponivel(new Error('Target crashed'))).toBe(false);
    expect(isChromiumIndisponivel('Chromium não encontrado')).toBe(false);
    expect(isChromiumIndisponivel(null)).toBe(false);
  });
});
