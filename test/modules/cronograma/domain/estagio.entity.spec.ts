import ErrorCodeConstants from '@/core/constants/error_code.constants';
import EstagioEntity from '@/modules/cronograma/domain/entities/estagio.entity';

describe('EstagioEntity', () => {
  it('creates a stage with defaults', () => {
    const stage = EstagioEntity.create({ tenantId: 'tenant', obraId: 'obra', nome: 'Fundação' });

    expect(stage.nome).toBe('Fundação');
    expect(stage.posicao).toBe(0);
    expect(stage.status).toBe('PENDENTE');
    expect(stage.ativo).toBe(true);
  });

  it('rejects blank names and negative positions', () => {
    expect(() => EstagioEntity.create({ tenantId: 'tenant', obraId: 'obra', nome: ' ' })).toThrow(
      ErrorCodeConstants.CRONOGRAMA_INVALID_INPUT,
    );
    expect(() => EstagioEntity.create({ tenantId: 'tenant', obraId: 'obra', nome: 'Etapa', posicao: -1 })).toThrow(
      ErrorCodeConstants.CRONOGRAMA_INVALID_INPUT,
    );
  });
});
