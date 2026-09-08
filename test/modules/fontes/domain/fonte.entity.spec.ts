import ErrorCodeConstants from '@/core/constants/error_code.constants';
import FonteEntity from '@/modules/fontes/domain/entities/fonte.entity';
import FonteDomainException from '@/modules/fontes/exceptions/fonte_domain.exception';

describe('FonteEntity', () => {
  const base = {
    tenantId: '9f8b416e-2b4c-4e4a-b1c7-6beeb3d4d7dc',
    nome: 'Tesouro Municipal',
    descricao: 'Fonte principal',
    codigo: 'F-001',
    tipo: 'TESOURO',
    valorPrevisto: '100000.00',
    vigencia: '2026',
  };

  it('creates an active fonte with normalized values and generated identity', () => {
    const fonte = FonteEntity.create({ ...base, nome: ` ${base.nome} ` });
    expect(fonte.id).toEqual(expect.any(String));
    expect(fonte.nome).toBe('Tesouro Municipal');
    expect(fonte.codigo).toBe('F-001');
    expect(fonte.ativo).toBe(true);
    expect(fonte.tenantId).toBe(base.tenantId);
    expect(fonte.createdAt).toBeInstanceOf(Date);
  });

  it('creates with optional fields as null when omitted', () => {
    const fonte = FonteEntity.create({ tenantId: base.tenantId, nome: 'Convênio' });
    expect(fonte.descricao).toBeNull();
    expect(fonte.codigo).toBeNull();
    expect(fonte.tipo).toBeNull();
    expect(fonte.valorPrevisto).toBeNull();
    expect(fonte.vigencia).toBeNull();
    expect(fonte.ativo).toBe(true);
  });

  it('rejects blank nome with stable error code', () => {
    expect.assertions(2);
    try {
      FonteEntity.create({ tenantId: base.tenantId, nome: '  ' });
    } catch (error) {
      expect(error).toBeInstanceOf(FonteDomainException);
      expect((error as FonteDomainException).code).toBe(ErrorCodeConstants.FONTE_INVALID_NAME);
    }
  });
});
