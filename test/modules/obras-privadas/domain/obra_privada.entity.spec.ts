import ErrorCodeConstants from '@/core/constants/error_code.constants';
import ObraPrivadaDomainException from '@/modules/obras-privadas/exceptions/obra_privada_domain.exception';
import ObraPrivadaEntity from '@/modules/obras-privadas/domain/entities/obra_privada.entity';

describe('ObraPrivadaEntity', () => {
  const base = {
    tenantId: 't1',
    codigo: 'OBP-2026-0001',
    descricao: 'Construção Residencial',
    proprietarioPessoaId: 'pessoa-1',
    logradouro: 'Rua A',
    uf: 'pi',
  };

  it('creates private work with normalized fields and SEM_ALVARA initial state', () => {
    const obra = ObraPrivadaEntity.create(base);
    expect(obra.id).toEqual(expect.any(String));
    expect(obra.codigo).toBe('OBP-2026-0001');
    expect(obra.toObject().descricao).toBe('Construção Residencial');
    expect(obra.toObject().uf).toBe('PI');
    expect(obra.toObject().situacaoAlvara).toBe('SEM_ALVARA');
    expect(obra.toObject().logradouro).toBe('Rua A');
  });

  it('ignores caller situacaoAlvara and forces SEM_ALVARA', () => {
    const obra = ObraPrivadaEntity.create({ ...base, situacaoAlvara: 'COM_ALVARA_VIGENTE' });
    expect(obra.toObject().situacaoAlvara).toBe('SEM_ALVARA');
  });

  it.each([
    [{ ...base, descricao: '  ' }, ErrorCodeConstants.OBRA_PRIVADA_INVALID_DESCRICAO],
    [{ ...base, proprietarioPessoaId: '' }, ErrorCodeConstants.OBRA_PRIVADA_INVALID_PROPRIETARIO],
    [{ ...base, logradouro: '  ' }, ErrorCodeConstants.OBRA_PRIVADA_INVALID_LOGRADOURO],
    [{ ...base, uf: 'P' }, ErrorCodeConstants.OBRA_PRIVADA_INVALID_UF],
    [{ ...base, uf: '' }, ErrorCodeConstants.OBRA_PRIVADA_INVALID_UF],
  ])('rejects invalid payload %#', (props, code) => {
    expect.assertions(2);
    try {
      ObraPrivadaEntity.create(props);
    } catch (e) {
      expect(e).toBeInstanceOf(ObraPrivadaDomainException);
      expect((e as ObraPrivadaDomainException).code).toBe(code);
    }
  });
});
