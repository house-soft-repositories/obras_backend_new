import { randomUUID } from 'node:crypto';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import CronogramaDomainException from '@/modules/cronograma/exceptions/cronograma_domain.exception';
import {
  EstagioStatus,
  ModoDuracao,
} from '@/modules/cronograma/domain/enums/cronograma.enums';

export interface EstagioProps {
  id: string;
  tenantId: string;
  obraId: string;
  nome: string;
  posicao: number;
  ativo: boolean;
  status: EstagioStatus;
  modoDuracao: ModoDuracao;
  dataInicio: string | null;
  dataFim: string | null;
  percentualDireto: number | null;
  responsavelUsuarioId: string | null;
  criadoEm: Date;
  atualizadoEm: Date;
}
export default class EstagioEntity {
  private constructor(private readonly props: EstagioProps) {}
  static create(
    p: Omit<
      EstagioProps,
      | 'id'
      | 'status'
      | 'ativo'
      | 'modoDuracao'
      | 'dataInicio'
      | 'dataFim'
      | 'percentualDireto'
      | 'responsavelUsuarioId'
      | 'criadoEm'
      | 'atualizadoEm'
    > &
      Partial<
        Pick<
          EstagioProps,
          | 'posicao'
          | 'modoDuracao'
          | 'dataInicio'
          | 'dataFim'
          | 'responsavelUsuarioId'
        >
      >,
  ): EstagioEntity {
    const nome = p.nome.trim();
    if (!nome || p.posicao < 0)
      throw new CronogramaDomainException({
        code: ErrorCodeConstants.CRONOGRAMA_INVALID_INPUT,
      });
    const now = new Date();
    return new EstagioEntity({
      id: randomUUID(),
      tenantId: p.tenantId,
      obraId: p.obraId,
      nome,
      posicao: p.posicao ?? 0,
      ativo: true,
      status: EstagioStatus.PENDENTE,
      modoDuracao: p.modoDuracao ?? ModoDuracao.NAO_INFORMADO,
      dataInicio: p.dataInicio ?? null,
      dataFim: p.dataFim ?? null,
      percentualDireto: null,
      responsavelUsuarioId: p.responsavelUsuarioId ?? null,
      criadoEm: now,
      atualizadoEm: now,
    });
  }
  static fromData(props: EstagioProps): EstagioEntity {
    return new EstagioEntity(props);
  }
  update(p: {
    nome?: string;
    posicao?: number;
    dataInicio?: string | null;
    dataFim?: string | null;
    responsavelUsuarioId?: string | null;
  }): EstagioEntity {
    const nome = p.nome === undefined ? this.nome : p.nome.trim();
    const posicao = p.posicao ?? this.posicao;
    if (!nome || posicao < 0)
      throw new CronogramaDomainException({
        code: ErrorCodeConstants.CRONOGRAMA_INVALID_INPUT,
      });
    return new EstagioEntity({
      ...this.props,
      nome,
      posicao,
      dataInicio: p.dataInicio === undefined ? this.dataInicio : p.dataInicio,
      dataFim: p.dataFim === undefined ? this.dataFim : p.dataFim,
      responsavelUsuarioId:
        p.responsavelUsuarioId === undefined
          ? this.responsavelUsuarioId
          : p.responsavelUsuarioId,
      atualizadoEm: new Date(),
    });
  }
  get id() {
    return this.props.id;
  }
  get tenantId() {
    return this.props.tenantId;
  }
  get obraId() {
    return this.props.obraId;
  }
  get nome() {
    return this.props.nome;
  }
  get posicao() {
    return this.props.posicao;
  }
  get ativo() {
    return this.props.ativo;
  }
  get status() {
    return this.props.status;
  }
  get modoDuracao() {
    return this.props.modoDuracao;
  }
  get dataInicio() {
    return this.props.dataInicio;
  }
  get dataFim() {
    return this.props.dataFim;
  }
  get percentualDireto() {
    return this.props.percentualDireto;
  }
  get responsavelUsuarioId() {
    return this.props.responsavelUsuarioId;
  }
  get criadoEm() {
    return this.props.criadoEm;
  }
  get atualizadoEm() {
    return this.props.atualizadoEm;
  }
  toObject() {
    return { ...this.props };
  }
}
