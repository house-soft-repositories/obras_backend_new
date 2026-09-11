import ObraEntity from '@/modules/obras/domain/entities/obra.entity';
import ObraModel from '@/modules/obras/infra/models/obra.model';
import { TipoFinanciamento } from '@/modules/obras/domain/enums/tipo_financiamento.enum';
import { ModoDuracao } from '@/modules/obras/domain/enums/modo_duracao.enum';
import { AcaoConveniada } from '@/modules/obras/domain/enums/acao_conveniada.enum';

export default abstract class ObraMapper {
  static toModel(e: ObraEntity): Partial<ObraModel> {
    return e.toObject() as unknown as Partial<ObraModel>;
  }

  static toEntity(m: ObraModel & Record<string, unknown>): ObraEntity {
    const anyM = m as unknown as Record<string, unknown>;
    return ObraEntity.fromData({
      id: m.id,
      tenantId: (anyM['tenantId'] as string) ?? '',
      codigo: m.codigo,
      nome: m.nome,
      descricao: m.descricao,
      tipo: m.tipo,
      status: m.status,
      tipoFinanciamento:
        (anyM['tipoFinanciamento'] as TipoFinanciamento) ?? TipoFinanciamento.SEM_OGU,
      modoDuracao:
        (anyM['modoDuracao'] as ModoDuracao) ?? ModoDuracao.DEFINIDO_PELO_USUARIO,
      dataInicio: (anyM['dataInicio'] as string | null) ?? null,
      dataPrazo: (anyM['dataPrazo'] as string | null) ?? null,
      acaoConveniada:
        (anyM['acaoConveniada'] as AcaoConveniada) ?? AcaoConveniada.NAO,
      prioritaria: (anyM['prioritaria'] as boolean) ?? false,
      exibirCameraAoVivo: (anyM['exibirCameraAoVivo'] as boolean) ?? false,
      cameraUrl: (anyM['cameraUrl'] as string | null) ?? null,
      privado: (anyM['privado'] as boolean) ?? false,
      invisivel: (anyM['invisivel'] as boolean) ?? false,
      considerarSabado: (anyM['considerarSabado'] as boolean) ?? false,
      considerarDomingo: (anyM['considerarDomingo'] as boolean) ?? false,
      seguirAutomatico: m.seguirAutomatico,
      vincularPagamentoPercentual:
        (anyM['vincularPagamentoPercentual'] as boolean) ?? false,
      corresponsaveisPodemEditar:
        (anyM['corresponsaveisPodemEditar'] as boolean) ?? false,
      orgaoId: m.orgaoId,
      setorId: m.setorId,
      localidadeId: m.localidadeId,
      subclassificacaoId: m.subclassificacaoId,
      eixoId: m.eixoId,
      classificacaoId: m.classificacaoId,
      tipologiaId: m.tipologiaId,
      subtipologiaId: m.subtipologiaId,
      programaPpa: (anyM['programaPpa'] as string | null) ?? null,
      acaoEstrategica: (anyM['acaoEstrategica'] as string | null) ?? null,
      acaoOrcamentaria: (anyM['acaoOrcamentaria'] as string | null) ?? null,
      unidadeMedida: (anyM['unidadeMedida'] as string | null) ?? null,
      quantidade: (anyM['quantidade'] as string | null) ?? null,
      secretario: (anyM['secretario'] as string | null) ?? null,
      dataPactuada: (anyM['dataPactuada'] as string | null) ?? null,
      criadoPorUsuarioId: m.criadoPorUsuarioId,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      deletedAt: (anyM['deletedAt'] as Date | null) ?? null,
    });
  }
}
