import ErrorCodeConstants from '@/core/constants/error_code.constants';
import EstagioEntity from '@/modules/cronograma/domain/entities/estagio.entity';

describe('EstagioEntity', () => {
  it('creates a stage with defaults', () => {
    const stage = EstagioEntity.create({
      tenantId: 'tenant',
      obraId: 'obra',
      nome: 'Fundação',
    });

    expect(stage.nome).toBe('Fundação');
    expect(stage.posicao).toBe(0);
    expect(stage.status).toBe('PENDENTE');
    expect(stage.ativo).toBe(true);
  });

  it('rejects blank names and negative positions', () => {
    expect(() =>
      EstagioEntity.create({ tenantId: 'tenant', obraId: 'obra', nome: ' ' }),
    ).toThrow(ErrorCodeConstants.CRONOGRAMA_INVALID_INPUT);
    expect(() =>
      EstagioEntity.create({
        tenantId: 'tenant',
        obraId: 'obra',
        nome: 'Etapa',
        posicao: -1,
      }),
    ).toThrow(ErrorCodeConstants.CRONOGRAMA_INVALID_INPUT);
  });

  it('rejects an end date before the start date', () => {
    expect(() =>
      EstagioEntity.create({
        tenantId: 'tenant',
        obraId: 'obra',
        nome: 'Etapa',
        dataInicio: '2026-02-10',
        dataFim: '2026-02-09',
      }),
    ).toThrow(ErrorCodeConstants.CRONOGRAMA_INVALID_INPUT);
  });

  it('rejects an update that inverts the date range', () => {
    const stage = EstagioEntity.create({
      tenantId: 'tenant',
      obraId: 'obra',
      nome: 'Etapa',
      dataInicio: '2026-02-10',
      dataFim: '2026-02-12',
    });

    expect(() => stage.update({ dataFim: '2026-02-09' })).toThrow(
      ErrorCodeConstants.CRONOGRAMA_INVALID_INPUT,
    );
  });

  it('rejects self as parent on update', () => {
    const stage = EstagioEntity.create({
      tenantId: 'tenant',
      obraId: 'obra',
      nome: 'Etapa',
    });

    expect(() => stage.update({ estagioPaiId: stage.id })).toThrow(
      ErrorCodeConstants.CRONOGRAMA_ESTAGIO_PAI_INVALID,
    );
  });

  it('accepts a root parent and clearing the parent on update', () => {
    const parent = EstagioEntity.create({
      tenantId: 'tenant',
      obraId: 'obra',
      nome: 'Pai',
    });
    const child = EstagioEntity.create({
      tenantId: 'tenant',
      obraId: 'obra',
      nome: 'Filho',
      estagioPaiId: parent.id,
    });

    expect(child.estagioPaiId).toBe(parent.id);
    expect(child.update({ estagioPaiId: null }).estagioPaiId).toBeNull();
  });
});
