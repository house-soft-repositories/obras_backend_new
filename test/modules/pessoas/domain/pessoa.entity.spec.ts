import ErrorCodeConstants from '@/core/constants/error_code.constants';
import PessoaDomainException from '@/modules/pessoas/exceptions/pessoa_domain.exception';
import PessoaEntity from '@/modules/pessoas/domain/entities/pessoa.entity';

describe('PessoaEntity', () => {
  const base = {
    tenantId: '9f8b416e-2b4c-4e4a-b1c7-6beeb3d4d7dc',
    tipo: 'FISICA',
    documento: '52998224725',
    nome: 'João Silva',
    uf: 'pi',
  };

  it('creates a pessoa with normalized documento and uf upper', () => {
    const p = PessoaEntity.create(base as any);
    expect(p.id).toEqual(expect.any(String));
    expect(p.documento).toBe('52998224725');
    expect(p.nome).toBe('João Silva');
    expect(p.toObject().ativo).toBe(true);
    const obj = p.toObject();
    expect(obj.uf).toBe('PI');
  });

  it('normalizes documento stripping non-digits', () => {
    const p = PessoaEntity.create({
      ...base,
      documento: '529.982.247-25',
    } as any);
    expect(p.documento).toBe('52998224725');
  });

  it('creates pessoa juridica with valid normalized cnpj', () => {
    const p = PessoaEntity.create({
      ...base,
      tipo: 'JURIDICA',
      documento: '11.222.333/0001-81',
    } as any);
    expect(p.documento).toBe('11222333000181');
  });

  it.each([
    [{ ...base, tipo: '' }, ErrorCodeConstants.PESSOA_INVALID_TIPO],
    [
      { ...base, documento: '123' },
      ErrorCodeConstants.PESSOA_INVALID_DOCUMENTO,
    ],
    [
      { ...base, documento: '   ' },
      ErrorCodeConstants.PESSOA_INVALID_DOCUMENTO,
    ],
    [
      { ...base, documento: '12345678901' },
      ErrorCodeConstants.PESSOA_INVALID_DOCUMENTO,
    ],
    [
      { ...base, tipo: 'JURIDICA', documento: '52998224725' },
      ErrorCodeConstants.PESSOA_INVALID_DOCUMENTO,
    ],
    [{ ...base, nome: '  ' }, ErrorCodeConstants.PESSOA_INVALID_NOME],
    [{ ...base, nome: 'A' }, ErrorCodeConstants.PESSOA_INVALID_NOME],
  ])('rejects invalid payload with stable code %s', (props, code) => {
    expect.assertions(2);
    try {
      PessoaEntity.create(props as any);
    } catch (e) {
      expect(e).toBeInstanceOf(PessoaDomainException);
      expect((e as PessoaDomainException).code).toBe(code);
    }
  });
});
