import {
  PREFIXO_AUTO_INFRACAO,
  PREFIXO_FISCALIZACAO,
  PREFIXO_OBRA_PRIVADA,
  prefixoCodigoDoAno,
  proximoCodigo,
} from '@/modules/obras-privadas/services/codigo_privado.service';

describe('codigo privado', () => {
  it('builds the annual code prefix', () => {
    expect(prefixoCodigoDoAno(PREFIXO_OBRA_PRIVADA, 2026)).toBe('OBP-2026-');
  });

  it('starts each prefix sequence at 0001', () => {
    expect(proximoCodigo(PREFIXO_OBRA_PRIVADA, null, 2026)).toBe(
      'OBP-2026-0001',
    );
    expect(proximoCodigo(PREFIXO_FISCALIZACAO, null, 2026)).toBe(
      'FIS-2026-0001',
    );
    expect(proximoCodigo(PREFIXO_AUTO_INFRACAO, null, 2026)).toBe(
      'AI-2026-0001',
    );
  });

  it('increments the sequence for the same prefix and year', () => {
    expect(proximoCodigo(PREFIXO_OBRA_PRIVADA, 'OBP-2026-0099', 2026)).toBe(
      'OBP-2026-0100',
    );
  });

  it('restarts when the last code belongs to another year', () => {
    expect(proximoCodigo(PREFIXO_OBRA_PRIVADA, 'OBP-2025-0042', 2026)).toBe(
      'OBP-2026-0001',
    );
  });

  it('restarts when the last code has another prefix or invalid suffix', () => {
    expect(proximoCodigo(PREFIXO_FISCALIZACAO, 'AI-2026-0042', 2026)).toBe(
      'FIS-2026-0001',
    );
    expect(proximoCodigo(PREFIXO_FISCALIZACAO, 'FIS-2026-ABCD', 2026)).toBe(
      'FIS-2026-0001',
    );
  });

  it('does not truncate sequences above four digits', () => {
    expect(proximoCodigo(PREFIXO_AUTO_INFRACAO, 'AI-2026-9999', 2026)).toBe(
      'AI-2026-10000',
    );
  });
});
