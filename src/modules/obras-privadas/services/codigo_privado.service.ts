export const PREFIXO_OBRA_PRIVADA = 'OBP';
export const PREFIXO_FISCALIZACAO = 'FIS';
export const PREFIXO_AUTO_INFRACAO = 'AI';

const DIGITOS_SEQUENCIAL = 4;

export function prefixoCodigoDoAno(prefixo: string, ano: number): string {
  return `${prefixo}-${ano}-`;
}

export function proximoCodigo(
  prefixo: string,
  ultimoCodigo: string | null,
  ano: number,
): string {
  const inicio = prefixoCodigoDoAno(prefixo, ano);
  let sequencial = 1;

  if (ultimoCodigo?.startsWith(inicio)) {
    const ultimoSequencial = Number(ultimoCodigo.slice(inicio.length));
    if (Number.isInteger(ultimoSequencial) && ultimoSequencial >= 1) {
      sequencial = ultimoSequencial + 1;
    }
  }

  return `${inicio}${String(sequencial).padStart(DIGITOS_SEQUENCIAL, '0')}`;
}
