import EstagioEntity from '@/modules/cronograma/domain/entities/estagio.entity';

export default abstract class EstagioMapper {
  static toEntity(m: Record<string, any>): EstagioEntity {
    return EstagioEntity.fromData({
      id: m.id,
      tenantId: m.tenantId ?? m.tenant_id,
      obraId: m.obraId ?? m.obra_id,
      nome: m.nome,
      posicao: m.posicao,
      ativo: m.ativo,
      status: m.status,
      modoDuracao: m.modoDuracao ?? m.modo_duracao,
      dataInicio: m.dataInicio ?? m.data_inicio,
      dataFim: m.dataFim ?? m.data_fim,
      percentualDireto:
        (m.percentualDireto ?? m.percentual_direto) === null
          ? null
          : Number(m.percentualDireto ?? m.percentual_direto),
      responsavelUsuarioId: m.responsavelUsuarioId ?? m.responsavel_usuario_id,
      criadoEm: new Date(m.criadoEm ?? m.criado_em),
      atualizadoEm: new Date(m.atualizadoEm ?? m.atualizado_em),
    });
  }

  static toModel(e: EstagioEntity) {
    return {
      id: e.id,
      tenant_id: e.tenantId,
      obra_id: e.obraId,
      nome: e.nome,
      posicao: e.posicao,
      ativo: e.ativo,
      status: e.status,
      modo_duracao: e.modoDuracao,
      data_inicio: e.dataInicio,
      data_fim: e.dataFim,
      percentual_direto: e.percentualDireto,
      responsavel_usuario_id: e.responsavelUsuarioId,
      criado_em: e.criadoEm,
      atualizado_em: e.atualizadoEm,
    };
  }
}
