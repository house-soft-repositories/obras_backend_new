import { randomUUID } from 'node:crypto';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import ObraDomainException from '@/modules/obras/exceptions/obra_domain.exception';
import { TipoFinanciamento } from '@/modules/obras/domain/enums/tipo_financiamento.enum';
import { ModoDuracao } from '@/modules/obras/domain/enums/modo_duracao.enum';
import { AcaoConveniada } from '@/modules/obras/domain/enums/acao_conveniada.enum';

export interface ObraProps {
  id: string;
  tenantId: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  tipo: string;
  status: string;
  tipoFinanciamento: TipoFinanciamento;
  modoDuracao: ModoDuracao;
  dataInicio: string | null;
  dataPrazo: string | null;
  acaoConveniada: AcaoConveniada;
  prioritaria: boolean;
  exibirCameraAoVivo: boolean;
  cameraUrl: string | null;
  privado: boolean;
  invisivel: boolean;
  considerarSabado: boolean;
  considerarDomingo: boolean;
  seguirAutomatico: boolean;
  vincularPagamentoPercentual: boolean;
  corresponsaveisPodemEditar: boolean;
  orgaoId: string;
  setorId: string | null;
  localidadeId: string | null;
  subclassificacaoId: string | null;
  eixoId: string | null;
  classificacaoId: string | null;
  tipologiaId: string | null;
  subtipologiaId: string | null;
  programaPpa: string | null;
  acaoEstrategica: string | null;
  acaoOrcamentaria: string | null;
  unidadeMedida: string | null;
  quantidade: string | null;
  secretario: string | null;
  dataPactuada: string | null;
  criadoPorUsuarioId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export type CreateObraProps = {
  tenantId: string;
  codigo: string;
  nome: string;
  descricao?: string | null;
  tipo: string;
  status?: string;
  tipoFinanciamento?: TipoFinanciamento;
  modoDuracao?: ModoDuracao;
  dataInicio?: string | null;
  dataPrazo?: string | null;
  acaoConveniada?: AcaoConveniada;
  prioritaria?: boolean;
  exibirCameraAoVivo?: boolean;
  cameraUrl?: string | null;
  privado?: boolean;
  invisivel?: boolean;
  considerarSabado?: boolean;
  considerarDomingo?: boolean;
  seguirAutomatico?: boolean;
  vincularPagamentoPercentual?: boolean;
  corresponsaveisPodemEditar?: boolean;
  orgaoId: string;
  setorId?: string | null;
  localidadeId?: string | null;
  subclassificacaoId?: string | null;
  eixoId?: string | null;
  classificacaoId?: string | null;
  tipologiaId?: string | null;
  subtipologiaId?: string | null;
  programaPpa?: string | null;
  acaoEstrategica?: string | null;
  acaoOrcamentaria?: string | null;
  unidadeMedida?: string | null;
  quantidade?: string | null;
  secretario?: string | null;
  dataPactuada?: string | null;
  criadoPorUsuarioId: string;
};

export type UpdateObraProps = Partial<Omit<CreateObraProps, 'tenantId' | 'codigo' | 'criadoPorUsuarioId'>> & {
  status?: string;
};

export default class ObraEntity {
  private constructor(private readonly props: ObraProps) {}

  static create(p: CreateObraProps): ObraEntity {
    this.validateCreate(p);
    const now = new Date();
    return new ObraEntity({
      id: randomUUID(),
      tenantId: p.tenantId,
      codigo: p.codigo,
      nome: p.nome.trim(),
      descricao: p.descricao?.trim() || null,
      tipo: p.tipo,
      status: p.status || 'EM_ABERTO',
      tipoFinanciamento: p.tipoFinanciamento ?? TipoFinanciamento.SEM_OGU,
      modoDuracao: p.modoDuracao ?? ModoDuracao.DEFINIDO_PELO_USUARIO,
      dataInicio: p.dataInicio ?? null,
      dataPrazo: p.dataPrazo ?? null,
      acaoConveniada: p.acaoConveniada ?? AcaoConveniada.NAO,
      prioritaria: p.prioritaria ?? false,
      exibirCameraAoVivo: p.exibirCameraAoVivo ?? false,
      cameraUrl: p.cameraUrl?.trim() || null,
      privado: p.privado ?? false,
      invisivel: p.invisivel ?? false,
      considerarSabado: p.considerarSabado ?? false,
      considerarDomingo: p.considerarDomingo ?? false,
      seguirAutomatico: p.seguirAutomatico ?? false,
      vincularPagamentoPercentual: p.vincularPagamentoPercentual ?? false,
      corresponsaveisPodemEditar: p.corresponsaveisPodemEditar ?? false,
      orgaoId: p.orgaoId,
      setorId: p.setorId || null,
      localidadeId: p.localidadeId || null,
      subclassificacaoId: p.subclassificacaoId || null,
      eixoId: p.eixoId || null,
      classificacaoId: p.classificacaoId || null,
      tipologiaId: p.tipologiaId || null,
      subtipologiaId: p.subtipologiaId || null,
      programaPpa: p.programaPpa?.trim() || null,
      acaoEstrategica: p.acaoEstrategica?.trim() || null,
      acaoOrcamentaria: p.acaoOrcamentaria?.trim() || null,
      unidadeMedida: p.unidadeMedida?.trim() || null,
      quantidade: p.quantidade ?? null,
      secretario: p.secretario?.trim() || null,
      dataPactuada: p.dataPactuada ?? null,
      criadoPorUsuarioId: p.criadoPorUsuarioId,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  static fromData(p: ObraProps): ObraEntity {
    return new ObraEntity(p);
  }

  static validateCreate(p: CreateObraProps): void {
    if (!p.nome?.trim() || p.nome.trim().length < 2)
      throw new ObraDomainException({ code: ErrorCodeConstants.OBRA_INVALID_NOME });
    if (!p.tipo)
      throw new ObraDomainException({ code: ErrorCodeConstants.OBRA_INVALID_TIPO });
    if (!p.orgaoId)
      throw new ObraDomainException({ code: ErrorCodeConstants.OBRA_INVALID_ORGAO });
    if (p.subclassificacaoId && p.tipo !== 'OBRA')
      throw new ObraDomainException({
        code: ErrorCodeConstants.OBRA_INVALID_SUBCLASSIFICACAO,
      });
    if (p.tipoFinanciamento && !Object.values(TipoFinanciamento).includes(p.tipoFinanciamento))
      throw new ObraDomainException({ code: ErrorCodeConstants.OBRA_INVALID_TIPO });
    if (p.modoDuracao && !Object.values(ModoDuracao).includes(p.modoDuracao))
      throw new ObraDomainException({ code: ErrorCodeConstants.OBRA_INVALID_TIPO });
    if (p.acaoConveniada && !Object.values(AcaoConveniada).includes(p.acaoConveniada))
      throw new ObraDomainException({ code: ErrorCodeConstants.OBRA_INVALID_TIPO });
    if (p.quantidade !== undefined && p.quantidade !== null && Number.isNaN(Number(p.quantidade)))
      throw new ObraDomainException({ code: ErrorCodeConstants.OBRA_INVALID_TIPO });
  }

  updatePartial(p: UpdateObraProps): void {
    const nextTipo = p.tipo ?? this.props.tipo;
    const nextSub = p.subclassificacaoId !== undefined ? p.subclassificacaoId : this.props.subclassificacaoId;
    if (nextSub && nextTipo !== 'OBRA') {
      throw new ObraDomainException({
        code: ErrorCodeConstants.OBRA_INVALID_SUBCLASSIFICACAO,
      });
    }
    if (p.nome !== undefined) {
      if (!p.nome?.trim() || p.nome.trim().length < 2)
        throw new ObraDomainException({ code: ErrorCodeConstants.OBRA_INVALID_NOME });
      (this.props as { nome: string }).nome = p.nome.trim();
    }
    if (p.descricao !== undefined) (this.props as { descricao: string | null }).descricao = p.descricao?.trim() || null;
    if (p.tipo !== undefined) (this.props as { tipo: string }).tipo = p.tipo;
    if (p.status !== undefined) (this.props as { status: string }).status = p.status;
    if (p.tipoFinanciamento !== undefined) (this.props as { tipoFinanciamento: TipoFinanciamento }).tipoFinanciamento = p.tipoFinanciamento;
    if (p.modoDuracao !== undefined) (this.props as { modoDuracao: ModoDuracao }).modoDuracao = p.modoDuracao;
    if (p.dataInicio !== undefined) (this.props as { dataInicio: string | null }).dataInicio = p.dataInicio;
    if (p.dataPrazo !== undefined) (this.props as { dataPrazo: string | null }).dataPrazo = p.dataPrazo;
    if (p.acaoConveniada !== undefined) (this.props as { acaoConveniada: AcaoConveniada }).acaoConveniada = p.acaoConveniada;
    if (p.prioritaria !== undefined) (this.props as { prioritaria: boolean }).prioritaria = p.prioritaria;
    if (p.exibirCameraAoVivo !== undefined) (this.props as { exibirCameraAoVivo: boolean }).exibirCameraAoVivo = p.exibirCameraAoVivo;
    if (p.cameraUrl !== undefined) (this.props as { cameraUrl: string | null }).cameraUrl = p.cameraUrl?.trim() || null;
    if (p.privado !== undefined) (this.props as { privado: boolean }).privado = p.privado;
    if (p.invisivel !== undefined) (this.props as { invisivel: boolean }).invisivel = p.invisivel;
    if (p.considerarSabado !== undefined) (this.props as { considerarSabado: boolean }).considerarSabado = p.considerarSabado;
    if (p.considerarDomingo !== undefined) (this.props as { considerarDomingo: boolean }).considerarDomingo = p.considerarDomingo;
    if (p.seguirAutomatico !== undefined) (this.props as { seguirAutomatico: boolean }).seguirAutomatico = p.seguirAutomatico;
    if (p.vincularPagamentoPercentual !== undefined) (this.props as { vincularPagamentoPercentual: boolean }).vincularPagamentoPercentual = p.vincularPagamentoPercentual;
    if (p.corresponsaveisPodemEditar !== undefined) (this.props as { corresponsaveisPodemEditar: boolean }).corresponsaveisPodemEditar = p.corresponsaveisPodemEditar;
    if (p.orgaoId !== undefined) (this.props as { orgaoId: string }).orgaoId = p.orgaoId;
    if (p.setorId !== undefined) (this.props as { setorId: string | null }).setorId = p.setorId;
    if (p.localidadeId !== undefined) (this.props as { localidadeId: string | null }).localidadeId = p.localidadeId;
    if (p.subclassificacaoId !== undefined) (this.props as { subclassificacaoId: string | null }).subclassificacaoId = p.subclassificacaoId;
    if (p.eixoId !== undefined) (this.props as { eixoId: string | null }).eixoId = p.eixoId;
    if (p.classificacaoId !== undefined) (this.props as { classificacaoId: string | null }).classificacaoId = p.classificacaoId;
    if (p.tipologiaId !== undefined) (this.props as { tipologiaId: string | null }).tipologiaId = p.tipologiaId;
    if (p.subtipologiaId !== undefined) (this.props as { subtipologiaId: string | null }).subtipologiaId = p.subtipologiaId;
    if (p.programaPpa !== undefined) (this.props as { programaPpa: string | null }).programaPpa = p.programaPpa?.trim() || null;
    if (p.acaoEstrategica !== undefined) (this.props as { acaoEstrategica: string | null }).acaoEstrategica = p.acaoEstrategica?.trim() || null;
    if (p.acaoOrcamentaria !== undefined) (this.props as { acaoOrcamentaria: string | null }).acaoOrcamentaria = p.acaoOrcamentaria?.trim() || null;
    if (p.unidadeMedida !== undefined) (this.props as { unidadeMedida: string | null }).unidadeMedida = p.unidadeMedida?.trim() || null;
    if (p.quantidade !== undefined) (this.props as { quantidade: string | null }).quantidade = p.quantidade;
    if (p.secretario !== undefined) (this.props as { secretario: string | null }).secretario = p.secretario?.trim() || null;
    if (p.dataPactuada !== undefined) (this.props as { dataPactuada: string | null }).dataPactuada = p.dataPactuada;
    (this.props as { updatedAt: Date }).updatedAt = new Date();
  }

  softDelete(): void {
    (this.props as { deletedAt: Date | null }).deletedAt = new Date();
    (this.props as { updatedAt: Date }).updatedAt = new Date();
  }

  toObject(): ObraProps {
    return { ...this.props };
  }

  get id() { return this.props.id; }
  get codigo() { return this.props.codigo; }
  get nome() { return this.props.nome; }
  get descricao() { return this.props.descricao; }
  get tipo() { return this.props.tipo; }
  get status() { return this.props.status; }
  get tipoFinanciamento() { return this.props.tipoFinanciamento; }
  get modoDuracao() { return this.props.modoDuracao; }
  get dataInicio() { return this.props.dataInicio; }
  get dataPrazo() { return this.props.dataPrazo; }
  get acaoConveniada() { return this.props.acaoConveniada; }
  get prioritaria() { return this.props.prioritaria; }
  get exibirCameraAoVivo() { return this.props.exibirCameraAoVivo; }
  get cameraUrl() { return this.props.cameraUrl; }
  get privado() { return this.props.privado; }
  get invisivel() { return this.props.invisivel; }
  get considerarSabado() { return this.props.considerarSabado; }
  get considerarDomingo() { return this.props.considerarDomingo; }
  get seguirAutomatico() { return this.props.seguirAutomatico; }
  get vincularPagamentoPercentual() { return this.props.vincularPagamentoPercentual; }
  get corresponsaveisPodemEditar() { return this.props.corresponsaveisPodemEditar; }
  get orgaoId() { return this.props.orgaoId; }
  get setorId() { return this.props.setorId; }
  get localidadeId() { return this.props.localidadeId; }
  get subclassificacaoId() { return this.props.subclassificacaoId; }
  get eixoId() { return this.props.eixoId; }
  get classificacaoId() { return this.props.classificacaoId; }
  get tipologiaId() { return this.props.tipologiaId; }
  get subtipologiaId() { return this.props.subtipologiaId; }
  get programaPpa() { return this.props.programaPpa; }
  get acaoEstrategica() { return this.props.acaoEstrategica; }
  get acaoOrcamentaria() { return this.props.acaoOrcamentaria; }
  get unidadeMedida() { return this.props.unidadeMedida; }
  get quantidade() { return this.props.quantidade; }
  get secretario() { return this.props.secretario; }
  get dataPactuada() { return this.props.dataPactuada; }
  get tenantId() { return this.props.tenantId; }
  get criadoPorUsuarioId() { return this.props.criadoPorUsuarioId; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }
  get deletedAt() { return this.props.deletedAt; }
}
