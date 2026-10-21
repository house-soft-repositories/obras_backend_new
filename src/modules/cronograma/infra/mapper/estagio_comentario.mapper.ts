import EstagioComentarioEntity from '@/modules/cronograma/domain/entities/estagio_comentario.entity';
import EstagioComentarioModel from '@/modules/cronograma/infra/models/estagio_comentario.model';
import BaseMapper from '@/core/types/base_mapper';

export default abstract class EstagioComentarioMapper extends BaseMapper<EstagioComentarioEntity, EstagioComentarioModel> {
  static toEntity(m: EstagioComentarioModel): EstagioComentarioEntity {
    return EstagioComentarioEntity.fromData({
      id: m.id,
      tenantId: m.tenantId,
      obraId: m.obraId,
      estagioId: m.estagioId,
      texto: m.texto,
      autorUsuarioId: m.autorUsuarioId,
      criadoEm: m.createdAt,
    });
  }

  static toModel(e: EstagioComentarioEntity): Partial<EstagioComentarioModel> {
    return {
      id: e.id,
      tenantId: e.tenantId,
      obraId: e.obraId,
      estagioId: e.estagioId,
      texto: e.texto,
      autorUsuarioId: e.autorUsuarioId,
    };
  }
}
