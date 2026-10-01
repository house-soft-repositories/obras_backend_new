import ObraPrivadaObservacaoEntity from '@/modules/obras-privadas/domain/entities/obra_privada_observacao.entity';
import ObraPrivadaObservacaoModel from '@/modules/obras-privadas/infra/models/obra_privada_observacao.model';

export default abstract class ObraPrivadaObservacaoMapper {
  static toModel(
    entity: ObraPrivadaObservacaoEntity,
  ): Partial<ObraPrivadaObservacaoModel> {
    return entity.toObject();
  }
  static toEntity(
    model: ObraPrivadaObservacaoModel,
  ): ObraPrivadaObservacaoEntity {
    return ObraPrivadaObservacaoEntity.fromData({
      id: model.id,
      tenantId: model.tenantId,
      obraPrivadaId: model.obraPrivadaId,
      texto: model.texto,
      autorUsuarioId: model.autorUsuarioId,
      createdAt: model.createdAt,
    });
  }
}
