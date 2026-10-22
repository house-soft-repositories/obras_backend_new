import EstagioAcompanhamentoEntity from '@/modules/cronograma/domain/entities/estagio_acompanhamento.entity';
import EstagioAcompanhamentoModel from '@/modules/cronograma/infra/models/estagio_acompanhamento.model';
import BaseMapper from '@/core/types/base_mapper';

export default abstract class EstagioAcompanhamentoMapper extends BaseMapper<
  EstagioAcompanhamentoEntity,
  EstagioAcompanhamentoModel
> {
  static toEntity(m: EstagioAcompanhamentoModel): EstagioAcompanhamentoEntity {
    return EstagioAcompanhamentoEntity.fromData({
      id: m.id,
      tenantId: m.tenantId,
      obraId: m.obraId,
      estagioId: m.estagioId,
      percentual: Number(m.percentual),
      data: m.data,
      observacao: m.observacao,
      autorUsuarioId: m.autorUsuarioId,
      criadoEm: m.createdAt,
    });
  }

  static toModel(
    e: EstagioAcompanhamentoEntity,
  ): Partial<EstagioAcompanhamentoModel> {
    return {
      id: e.id,
      tenantId: e.tenantId,
      obraId: e.obraId,
      estagioId: e.estagioId,
      percentual: e.percentual,
      data: e.data,
      observacao: e.observacao,
      autorUsuarioId: e.autorUsuarioId,
    };
  }
}
