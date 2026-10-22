import ObraEntity from '@/modules/obras/domain/entities/obra.entity';
import { StatusObra } from '@/modules/obras/domain/enums/status_obra.enum';
import { TipoObra } from '@/modules/obras/domain/enums/tipo_obra.enum';
import ObraMapper from '@/modules/obras/infra/mapper/obra.mapper';
import ObraModel from '@/modules/obras/infra/models/obra.model';

describe('ObraMapper', () => {
  const entity = ObraEntity.create({
    codigo: 'OBR-2026-0001',
    nome: 'Reforma Escola',
    tipo: TipoObra.OBRA,
    status: StatusObra.PARALISADO,
    orgaoId: 'org-1',
    criadoPorUsuarioId: 'user-1',
    setorId: null,
    localidadeId: null,
    descricao: null,
    dataInicio: null,
    dataPrazo: null,
    cameraUrl: null,
    dataPactuada: null,
  });

  it('maps an entity to a persistible partial model without tenantId', () => {
    const model = ObraMapper.toModel(entity);

    expect(model).toMatchObject({
      tipo: TipoObra.OBRA,
      status: StatusObra.PARALISADO,
      descricao: null,
      setorId: null,
      localidadeId: null,
    });
    expect(model).not.toHaveProperty('tenantId');
    expect(model).not.toHaveProperty('toObject');
  });

  it('reconstitutes an entity with enum and nullable values from a model', () => {
    const model = Object.assign(new ObraModel(), ObraMapper.toModel(entity));
    const reconstituted = ObraMapper.toEntity(model);

    expect(reconstituted).toBeInstanceOf(ObraEntity);
    expect(reconstituted.tipo).toBe(TipoObra.OBRA);
    expect(reconstituted.status).toBe(StatusObra.PARALISADO);
    expect(reconstituted.descricao).toBeNull();
    expect(reconstituted.setorId).toBeNull();
    expect(reconstituted.localidadeId).toBeNull();
  });
});
