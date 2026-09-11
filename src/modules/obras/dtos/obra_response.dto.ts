import ObraEntity from '@/modules/obras/domain/entities/obra.entity';

export default class ObraResponseDto {
  static fromEntity(e: ObraEntity) {
    const o = e.toObject();
    return {
      id: o.id,
      codigo: o.codigo,
      nome: o.nome,
      descricao: o.descricao,
      tipo: o.tipo,
      status: o.status,
      tipoFinanciamento: o.tipoFinanciamento,
      modoDuracao: o.modoDuracao,
      dataInicio: o.dataInicio,
      dataPrazo: o.dataPrazo,
      acaoConveniada: o.acaoConveniada,
      prioritaria: o.prioritaria,
      exibirCameraAoVivo: o.exibirCameraAoVivo,
      cameraUrl: o.cameraUrl,
      privado: o.privado,
      invisivel: o.invisivel,
      considerarSabado: o.considerarSabado,
      considerarDomingo: o.considerarDomingo,
      seguirAutomatico: o.seguirAutomatico,
      vincularPagamentoPercentual: o.vincularPagamentoPercentual,
      corresponsaveisPodemEditar: o.corresponsaveisPodemEditar,
      orgaoId: o.orgaoId,
      setorId: o.setorId,
      localidadeId: o.localidadeId,
      subclassificacaoId: o.subclassificacaoId,
      eixoId: o.eixoId,
      classificacaoId: o.classificacaoId,
      tipologiaId: o.tipologiaId,
      subtipologiaId: o.subtipologiaId,
      programaPpa: o.programaPpa,
      acaoEstrategica: o.acaoEstrategica,
      acaoOrcamentaria: o.acaoOrcamentaria,
      unidadeMedida: o.unidadeMedida,
      quantidade: o.quantidade,
      secretario: o.secretario,
      dataPactuada: o.dataPactuada,
      criadoPorUsuarioId: o.criadoPorUsuarioId,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
      deletedAt: o.deletedAt ? o.deletedAt.toISOString() : null,
    };
  }

  static fromPage(page: { data: ObraEntity[]; meta: { page: number; take: number; itemCount: number; pageCount: number; hasPreviousPage: boolean; hasNextPage: boolean } }) {
    return {
      data: page.data.map((e) => this.fromEntity(e as unknown as ObraEntity)),
      meta: page.meta,
    };
  }
}
