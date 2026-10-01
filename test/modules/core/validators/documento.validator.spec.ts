import DocumentoValidator, {
  limparDocumento,
} from '@/core/validators/documento.validator';

describe('validacao de documento (RN-PRV-02)', () => {
  describe('CPF', () => {
    it('aceita CPF valido com e sem mascara', () => {
      expect(DocumentoValidator.validateCpf('529.982.247-25')).toBe(true);
      expect(DocumentoValidator.validateCpf('52998224725')).toBe(true);
    });

    it('rejeita CPF com digito verificador errado', () => {
      expect(DocumentoValidator.validateCpf('529.982.247-26')).toBe(false);
    });

    it('rejeita sequencia de digitos repetidos', () => {
      expect(DocumentoValidator.validateCpf('111.111.111-11')).toBe(false);
      expect(DocumentoValidator.validateCpf('000.000.000-00')).toBe(false);
    });

    it('rejeita quantidade de digitos incorreta', () => {
      expect(DocumentoValidator.validateCpf('5299822472')).toBe(false);
      expect(DocumentoValidator.validateCpf('')).toBe(false);
    });
  });

  describe('CNPJ', () => {
    it('aceita CNPJ valido com e sem mascara', () => {
      expect(DocumentoValidator.validateCnpj('11.222.333/0001-81')).toBe(true);
      expect(DocumentoValidator.validateCnpj('11222333000181')).toBe(true);
    });

    it('rejeita CNPJ com digito verificador errado', () => {
      expect(DocumentoValidator.validateCnpj('11.222.333/0001-82')).toBe(false);
    });

    it('rejeita sequencia de digitos repetidos', () => {
      expect(DocumentoValidator.validateCnpj('11.111.111/1111-11')).toBe(false);
    });
  });

  describe('coerencia entre tipo e documento', () => {
    it('PF exige CPF', () => {
      expect(DocumentoValidator.validate('529.982.247-25', 'FISICA')).toBe(
        true,
      );
      expect(DocumentoValidator.validate('11.222.333/0001-81', 'FISICA')).toBe(
        false,
      );
    });

    it('PJ exige CNPJ', () => {
      expect(DocumentoValidator.validate('11.222.333/0001-81', 'JURIDICA')).toBe(
        true,
      );
      expect(DocumentoValidator.validate('529.982.247-25', 'JURIDICA')).toBe(
        false,
      );
    });
  });

  it('limpa e mascara conforme o tamanho', () => {
    expect(limparDocumento('529.982.247-25')).toBe('52998224725');
    expect(DocumentoValidator.mask('52998224725')).toBe('529.982.247-25');
    expect(DocumentoValidator.mask('11222333000181')).toBe(
      '11.222.333/0001-81',
    );
    expect(DocumentoValidator.mask('123')).toBe('123');
  });
});
