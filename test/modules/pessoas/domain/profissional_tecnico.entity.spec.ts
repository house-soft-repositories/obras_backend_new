import ErrorCodeConstants from '@/core/constants/error_code.constants';
import ProfissionalTecnicoEntity from '@/modules/pessoas/domain/entities/profissional_tecnico.entity';
import ProfissionalTecnicoDomainException from '@/modules/pessoas/exceptions/profissional_tecnico_domain.exception';

describe('ProfissionalTecnicoEntity', () => {
  const base = {
    pessoaId: '9f8b416e-2b4c-4e4a-b1c7-6beeb3d4d7dc',
    conselho: 'CREA',
    numeroRegistro: ' CREA-SP 123456 ',
    ufRegistro: 'sp',
    titulo: ' Eng. Civil ',
  } as const;

  it('creates profissional tecnico with normalized fields', () => {
    const entity = ProfissionalTecnicoEntity.create(base);
    expect(entity.id).toEqual(expect.any(String));
    expect(entity.numeroRegistro).toBe('CREA-SP 123456');
    expect(entity.ufRegistro).toBe('SP');
    expect(entity.titulo).toBe('Eng. Civil');
    expect(entity.ativo).toBe(true);
  });

  it('updates mutable profissional fields preserving identity', () => {
    const entity = ProfissionalTecnicoEntity.create(base);
    const updated = entity.update({ numeroRegistro: 'CREA 999', ativo: false });
    expect(updated.id).toBe(entity.id);
    expect(updated.createdAt).toBe(entity.createdAt);
    expect(updated.numeroRegistro).toBe('CREA 999');
    expect(updated.ativo).toBe(false);
  });

  it.each([
    [
      { ...base, pessoaId: '' },
      ErrorCodeConstants.PROFISSIONAL_TECNICO_INVALID_PESSOA,
    ],
    [
      { ...base, conselho: 'OAB' },
      ErrorCodeConstants.PROFISSIONAL_TECNICO_INVALID_CONSELHO,
    ],
    [
      { ...base, numeroRegistro: '   ' },
      ErrorCodeConstants.PROFISSIONAL_TECNICO_INVALID_NUMERO_REGISTRO,
    ],
  ])('rejects invalid payload with stable code', (props, code) => {
    expect.assertions(2);
    try {
      ProfissionalTecnicoEntity.create(props as any);
    } catch (error) {
      expect(error).toBeInstanceOf(ProfissionalTecnicoDomainException);
      expect((error as ProfissionalTecnicoDomainException).code).toBe(code);
    }
  });
});
