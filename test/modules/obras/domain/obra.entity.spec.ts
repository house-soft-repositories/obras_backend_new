import ErrorCodeConstants from '@/core/constants/error_code.constants';
import ObraDomainException from '@/modules/obras/exceptions/obra_domain.exception';
import ObraEntity from '@/modules/obras/domain/entities/obra.entity';

describe('ObraEntity', () => {
  const base = {
    tenantId: 't1',
    codigo: 'OBR-2026-0001',
    nome: 'Reforma Escola',
    tipo: 'OBRA',
    orgaoId: 'org-1',
    criadoPorUsuarioId: 'user-1',
  };

  it('creates obra with generated codigo and normalized nome', () => {
    const obra = ObraEntity.create({ ...base, nome: ` ${base.nome} ` });
    expect(obra.id).toEqual(expect.any(String));
    expect(obra.codigo).toBe('OBR-2026-0001');
    expect(obra.nome).toBe('Reforma Escola');
    expect(obra.toObject().status).toBe('EM_ABERTO');
    expect(obra.toObject().seguirAutomatico).toBe(false);
  });

  it('allows subclassificacao only when tipo is OBRA', () => {
    const obra = ObraEntity.create({ ...base, subclassificacaoId: 'sub-1' });
    expect(obra.toObject().subclassificacaoId).toBe('sub-1');
  });

  it.each([
    [{ ...base, nome: '  ' }, ErrorCodeConstants.OBRA_INVALID_NOME],
    [{ ...base, nome: 'A' }, ErrorCodeConstants.OBRA_INVALID_NOME],
    [{ ...base, tipo: '' }, ErrorCodeConstants.OBRA_INVALID_TIPO],
    [{ ...base, orgaoId: '' }, ErrorCodeConstants.OBRA_INVALID_ORGAO],
    [{ ...base, tipo: 'REFORMA', subclassificacaoId: 'sub-1' }, ErrorCodeConstants.OBRA_INVALID_SUBCLASSIFICACAO],
  ])('rejects invalid payload with code %#', (props, code) => {
    expect.assertions(2);
    try {
      ObraEntity.create(props);
    } catch (e) {
      expect(e).toBeInstanceOf(ObraDomainException);
      expect((e as ObraDomainException).code).toBe(code);
    }
  });
});
