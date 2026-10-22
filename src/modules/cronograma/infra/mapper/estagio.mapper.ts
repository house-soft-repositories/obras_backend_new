import EstagioEntity from '@/modules/cronograma/domain/entities/estagio.entity';
import EstagioModel from '@/modules/cronograma/infra/models/estagio.model';
import BaseMapper from '@/core/types/base_mapper';

export default abstract class EstagioMapper extends BaseMapper<
  EstagioEntity,
  EstagioModel
> {
  static toEntity(m: EstagioModel): EstagioEntity {
    return EstagioEntity.fromData({
      id: m.id,
      tenantId: m.tenantId,
      obraId: m.obraId,
      nome: m.nome,
      posicao: m.posicao,
      ativo: m.ativo,
      status: m.status,
      modoDuracao: m.modoDuracao,
      dataInicio: m.dataInicio,
      dataFim: m.dataFim,
      percentualDireto:
        m.percentualDireto === null ? null : Number(m.percentualDireto),
      responsavelUsuarioId: m.responsavelUsuarioId,
      estagioPaiId: m.estagioPaiId,
      criadoEm: m.createdAt,
      atualizadoEm: m.updatedAt,
    });
  }

  static toModel(e: EstagioEntity): Partial<EstagioModel> {
    return {
      id: e.id,
      tenantId: e.tenantId,
      obraId: e.obraId,
      nome: e.nome,
      posicao: e.posicao,
      ativo: e.ativo,
      status: e.status,
      modoDuracao: e.modoDuracao,
      dataInicio: e.dataInicio,
      dataFim: e.dataFim,
      percentualDireto: e.percentualDireto,
      responsavelUsuarioId: e.responsavelUsuarioId,
      estagioPaiId: e.estagioPaiId,
    };
  }
}
