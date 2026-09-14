import { randomUUID } from 'node:crypto';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import GuiaDomainException from '@/modules/obras/exceptions/guia_domain.exception';
import { SituacaoTitularidade } from '@/modules/obras/domain/enums/situacao_titularidade.enum';
import { SituacaoLicenca } from '@/modules/obras/domain/enums/situacao_licenca.enum';
import { TipoRecebimento } from '@/modules/obras/domain/enums/tipo_recebimento.enum';

export interface ObraLocalizacaoProps {
  id: string;
  tenantId: string;
  obraId: string;
  localidade: string;
  uf: string;
  latitude: string | null;
  longitude: string | null;
  createdAt: Date;
}

export class ObraLocalizacaoEntity {
  private constructor(private readonly props: ObraLocalizacaoProps) {}
  static create(p: { tenantId: string; obraId: string; localidade: string; uf: string; latitude?: string | null; longitude?: string | null }): ObraLocalizacaoEntity {
    const localidade = p.localidade?.trim();
    if (!localidade) throw new GuiaDomainException({ code: ErrorCodeConstants.GUIA_INVALID_INPUT });
    const uf = p.uf?.trim()?.toUpperCase();
    if (!uf || uf.length !== 2) throw new GuiaDomainException({ code: ErrorCodeConstants.GUIA_INVALID_INPUT });
    if (!p.obraId) throw new GuiaDomainException({ code: ErrorCodeConstants.GUIA_NOT_FOUND });
    return new ObraLocalizacaoEntity({ id: randomUUID(), tenantId: p.tenantId, obraId: p.obraId, localidade, uf, latitude: p.latitude ?? null, longitude: p.longitude ?? null, createdAt: new Date() });
  }
  static fromData(p: ObraLocalizacaoProps): ObraLocalizacaoEntity { return new ObraLocalizacaoEntity(p); }
  toObject(): ObraLocalizacaoProps { return { ...this.props }; }
  get id() { return this.props.id; }
  get tenantId() { return this.props.tenantId; }
  get obraId() { return this.props.obraId; }
  get localidade() { return this.props.localidade; }
  get uf() { return this.props.uf; }
  get latitude() { return this.props.latitude; }
  get longitude() { return this.props.longitude; }
  get createdAt() { return this.props.createdAt; }
}

export interface ObraOrcamentoPrevistoProps {
  id: string;
  tenantId: string;
  obraId: string;
  fonteId: string;
  valor: string;
  createdAt: Date;
}

export class ObraOrcamentoPrevistoEntity {
  private constructor(private readonly props: ObraOrcamentoPrevistoProps) {}
  static create(p: { tenantId: string; obraId: string; fonteId: string; valor: string }): ObraOrcamentoPrevistoEntity {
    if (!p.fonteId) throw new GuiaDomainException({ code: ErrorCodeConstants.GUIA_INVALID_INPUT });
    if (!p.valor || !/^\d+(\.\d{1,2})?$/.test(p.valor) || Number(p.valor) <= 0) throw new GuiaDomainException({ code: ErrorCodeConstants.GUIA_INVALID_INPUT });
    if (!p.obraId) throw new GuiaDomainException({ code: ErrorCodeConstants.GUIA_NOT_FOUND });
    return new ObraOrcamentoPrevistoEntity({ id: randomUUID(), tenantId: p.tenantId, obraId: p.obraId, fonteId: p.fonteId, valor: p.valor, createdAt: new Date() });
  }
  static fromData(p: ObraOrcamentoPrevistoProps): ObraOrcamentoPrevistoEntity { return new ObraOrcamentoPrevistoEntity(p); }
  toObject(): ObraOrcamentoPrevistoProps { return { ...this.props }; }
  get id() { return this.props.id; }
  get tenantId() { return this.props.tenantId; }
  get obraId() { return this.props.obraId; }
  get fonteId() { return this.props.fonteId; }
  get valor() { return this.props.valor; }
  get createdAt() { return this.props.createdAt; }
}

export interface TitularidadeProps {
  id: string;
  tenantId: string;
  obraId: string;
  situacao: SituacaoTitularidade;
  tipo: string | null;
  observacoes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class TitularidadeEntity {
  private constructor(private props: TitularidadeProps) {}
  static create(p: { tenantId: string; obraId: string; situacao: SituacaoTitularidade; tipo?: string | null; observacoes?: string | null }): TitularidadeEntity {
    if (!Object.values(SituacaoTitularidade).includes(p.situacao)) throw new GuiaDomainException({ code: ErrorCodeConstants.GUIA_INVALID_ENUM });
    if (!p.obraId) throw new GuiaDomainException({ code: ErrorCodeConstants.GUIA_NOT_FOUND });
    const now = new Date();
    return new TitularidadeEntity({ id: randomUUID(), tenantId: p.tenantId, obraId: p.obraId, situacao: p.situacao, tipo: p.tipo?.trim() || null, observacoes: p.observacoes?.trim() || null, createdAt: now, updatedAt: now });
  }
  static fromData(p: TitularidadeProps): TitularidadeEntity { return new TitularidadeEntity(p); }
  update(p: { situacao?: SituacaoTitularidade; tipo?: string | null; observacoes?: string | null }): void {
    if (p.situacao !== undefined) {
      if (!Object.values(SituacaoTitularidade).includes(p.situacao)) throw new GuiaDomainException({ code: ErrorCodeConstants.GUIA_INVALID_ENUM });
      (this.props as { situacao: SituacaoTitularidade }).situacao = p.situacao;
    }
    if (p.tipo !== undefined) (this.props as { tipo: string | null }).tipo = p.tipo?.trim() || null;
    if (p.observacoes !== undefined) (this.props as { observacoes: string | null }).observacoes = p.observacoes?.trim() || null;
    (this.props as { updatedAt: Date }).updatedAt = new Date();
  }
  toObject(): TitularidadeProps { return { ...this.props }; }
  get id() { return this.props.id; }
  get tenantId() { return this.props.tenantId; }
  get obraId() { return this.props.obraId; }
  get situacao() { return this.props.situacao; }
  get tipo() { return this.props.tipo; }
  get observacoes() { return this.props.observacoes; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }
}

export interface LicencaProps {
  id: string;
  tenantId: string;
  obraId: string;
  situacao: SituacaoLicenca;
  tipo: string | null;
  numero: string | null;
  validade: string | null;
  observacoes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class LicencaEntity {
  private constructor(private props: LicencaProps) {}
  static create(p: { tenantId: string; obraId: string; situacao: SituacaoLicenca; tipo?: string | null; numero?: string | null; validade?: string | null; observacoes?: string | null }): LicencaEntity {
    if (!Object.values(SituacaoLicenca).includes(p.situacao)) throw new GuiaDomainException({ code: ErrorCodeConstants.GUIA_INVALID_ENUM });
    if (!p.obraId) throw new GuiaDomainException({ code: ErrorCodeConstants.GUIA_NOT_FOUND });
    const now = new Date();
    return new LicencaEntity({ id: randomUUID(), tenantId: p.tenantId, obraId: p.obraId, situacao: p.situacao, tipo: p.tipo?.trim() || null, numero: p.numero?.trim() || null, validade: p.validade || null, observacoes: p.observacoes?.trim() || null, createdAt: now, updatedAt: now });
  }
  static fromData(p: LicencaProps): LicencaEntity { return new LicencaEntity(p); }
  update(p: { situacao?: SituacaoLicenca; tipo?: string | null; numero?: string | null; validade?: string | null; observacoes?: string | null }): void {
    if (p.situacao !== undefined) {
      if (!Object.values(SituacaoLicenca).includes(p.situacao)) throw new GuiaDomainException({ code: ErrorCodeConstants.GUIA_INVALID_ENUM });
      (this.props as { situacao: SituacaoLicenca }).situacao = p.situacao;
    }
    if (p.tipo !== undefined) (this.props as { tipo: string | null }).tipo = p.tipo?.trim() || null;
    if (p.numero !== undefined) (this.props as { numero: string | null }).numero = p.numero?.trim() || null;
    if (p.validade !== undefined) (this.props as { validade: string | null }).validade = p.validade || null;
    if (p.observacoes !== undefined) (this.props as { observacoes: string | null }).observacoes = p.observacoes?.trim() || null;
    (this.props as { updatedAt: Date }).updatedAt = new Date();
  }
  toObject(): LicencaProps { return { ...this.props }; }
  get id() { return this.props.id; }
  get tenantId() { return this.props.tenantId; }
  get obraId() { return this.props.obraId; }
  get situacao() { return this.props.situacao; }
  get tipo() { return this.props.tipo; }
  get numero() { return this.props.numero; }
  get validade() { return this.props.validade; }
  get observacoes() { return this.props.observacoes; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }
}

export interface RecebimentoProps {
  id: string;
  tenantId: string;
  obraId: string;
  tipo: TipoRecebimento;
  data: string | null;
  dataPrevista: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class RecebimentoEntity {
  private constructor(private props: RecebimentoProps) {}
  static create(p: { tenantId: string; obraId: string; tipo: TipoRecebimento; data?: string | null; dataPrevista?: string | null }): RecebimentoEntity {
    if (!Object.values(TipoRecebimento).includes(p.tipo)) throw new GuiaDomainException({ code: ErrorCodeConstants.GUIA_INVALID_ENUM });
    if (!p.obraId) throw new GuiaDomainException({ code: ErrorCodeConstants.GUIA_NOT_FOUND });
    const now = new Date();
    return new RecebimentoEntity({ id: randomUUID(), tenantId: p.tenantId, obraId: p.obraId, tipo: p.tipo, data: p.data || null, dataPrevista: p.dataPrevista || null, createdAt: now, updatedAt: now });
  }
  static fromData(p: RecebimentoProps): RecebimentoEntity { return new RecebimentoEntity(p); }
  update(p: { tipo?: TipoRecebimento; data?: string | null; dataPrevista?: string | null }): void {
    if (p.tipo !== undefined) {
      if (!Object.values(TipoRecebimento).includes(p.tipo)) throw new GuiaDomainException({ code: ErrorCodeConstants.GUIA_INVALID_ENUM });
      (this.props as { tipo: TipoRecebimento }).tipo = p.tipo;
    }
    if (p.data !== undefined) (this.props as { data: string | null }).data = p.data || null;
    if (p.dataPrevista !== undefined) (this.props as { dataPrevista: string | null }).dataPrevista = p.dataPrevista || null;
    (this.props as { updatedAt: Date }).updatedAt = new Date();
  }
  toObject(): RecebimentoProps { return { ...this.props }; }
  get id() { return this.props.id; }
  get tenantId() { return this.props.tenantId; }
  get obraId() { return this.props.obraId; }
  get tipo() { return this.props.tipo; }
  get data() { return this.props.data; }
  get dataPrevista() { return this.props.dataPrevista; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }
}
