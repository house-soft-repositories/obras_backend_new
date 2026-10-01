/** Remove tudo que nao for digito. */
export function limparDocumento(valor: string): string {
  return (valor ?? '').replace(/\D/g, '');
}

/** Calcula um digito verificador mod 11 sobre os pesos informados. */
function digitoMod11(digitos: number[], pesos: number[]): number {
  const soma = digitos.reduce((acc, d, i) => acc + d * pesos[i], 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export type TipoPessoaDocumento = 'FISICA' | 'JURIDICA';

/**
 * Validacao de CPF e CNPJ por digito verificador (RN-PRV-02). Classe estatica
 * nos moldes dos validators de dominio: nunca instanciar, usar direto nas
 * entities.
 *
 * O backend valida porque o cadastro de pessoa e a chave de identidade do
 * proprietario: um CPF digitado errado cria um cadastro duplicado que so
 * aparece meses depois, quando alguem tenta autuar a pessoa errada.
 */
export default abstract class DocumentoValidator {
  /**
   * CPF valido: 11 digitos, nao todos iguais, e os dois DV conferem.
   * Sequencias repetidas (000.000.000-00, 111.111.111-11, ...) passam no
   * mod 11 mas sao invalidas por definicao da Receita.
   */
  static validateCpf(valor: string): boolean {
    const d = limparDocumento(valor);
    if (d.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(d)) return false;

    const nums = d.split('').map(Number);
    const dv1 = digitoMod11(nums.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]);
    if (dv1 !== nums[9]) return false;
    const dv2 = digitoMod11(
      nums.slice(0, 10),
      [11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
    );
    return dv2 === nums[10];
  }

  /** CNPJ valido: 14 digitos, nao todos iguais, e os dois DV conferem. */
  static validateCnpj(valor: string): boolean {
    const d = limparDocumento(valor);
    if (d.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(d)) return false;

    const nums = d.split('').map(Number);
    const dv1 = digitoMod11(
      nums.slice(0, 12),
      [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
    );
    if (dv1 !== nums[12]) return false;
    const dv2 = digitoMod11(
      nums.slice(0, 13),
      [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
    );
    return dv2 === nums[13];
  }

  /**
   * Valida o documento conforme o tipo declarado: PF exige CPF, PJ exige CNPJ.
   * A checagem e cruzada de proposito — aceitar CNPJ num cadastro marcado como
   * pessoa fisica quebraria os filtros e os relatorios por tipo.
   */
  static validate(valor: string, tipo: TipoPessoaDocumento): boolean {
    return tipo === 'FISICA'
      ? DocumentoValidator.validateCpf(valor)
      : DocumentoValidator.validateCnpj(valor);
  }

  /** Aplica a mascara de exibicao (CPF 000.000.000-00, CNPJ 00.000.000/0000-00). */
  static mask(valor: string): string {
    const d = limparDocumento(valor);
    if (d.length === 11) {
      return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
    }
    if (d.length === 14) {
      return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
    }
    return d;
  }
}
