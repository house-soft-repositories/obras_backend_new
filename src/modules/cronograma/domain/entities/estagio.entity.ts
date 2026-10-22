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
  estagioPaiId: string | null;
  criadoEm: Date;
  atualizadoEm: Date;
}
export default class EstagioEntity {
  private constructor(private readonly props: EstagioProps) {}
  static create(
    createParams: Omit<
      EstagioProps,
      | 'id'
      | 'status'
      | 'ativo'
      | 'modoDuracao'
      | 'dataInicio'
      | 'dataFim'
      | 'percentualDireto'
      | 'responsavelUsuarioId'
      | 'estagioPaiId'
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
          | 'estagioPaiId'
        >
      >,
  ): EstagioEntity {
    const nome = createParams.nome.trim();
    if (
      !nome ||
      (createParams.posicao !== undefined && createParams.posicao < 0) ||
      !this.isDateRangeValid(createParams.dataInicio, createParams.dataFim)
    )
      throw new CronogramaDomainException({
        code: ErrorCodeConstants.CRONOGRAMA_INVALID_INPUT,
      });
    const now = new Date();
    return new EstagioEntity({
      id: randomUUID(),
      tenantId: createParams.tenantId,
      obraId: createParams.obraId,
      nome,
      posicao: createParams.posicao ?? 0,
      ativo: true,
      status: EstagioStatus.PENDENTE,
      modoDuracao: createParams.modoDuracao ?? ModoDuracao.NAO_INFORMADO,
      dataInicio: createParams.dataInicio ?? null,
      dataFim: createParams.dataFim ?? null,
      percentualDireto: null,
      responsavelUsuarioId: createParams.responsavelUsuarioId ?? null,
      estagioPaiId: createParams.estagioPaiId ?? null,
      criadoEm: now,
      atualizadoEm: now,
    });
  }
  static fromData(props: EstagioProps): EstagioEntity {
    return new EstagioEntity(props);
  }
  update(updateParams: {
    nome?: string;
    posicao?: number;
    dataInicio?: string | null;
    dataFim?: string | null;
    responsavelUsuarioId?: string | null;
    estagioPaiId?: string | null;
  }): EstagioEntity {
    const nome =
      updateParams.nome === undefined ? this.nome : updateParams.nome.trim();
    const posicao = updateParams.posicao ?? this.posicao;
    const dataInicio =
      updateParams.dataInicio === undefined
        ? this.dataInicio
        : updateParams.dataInicio;
    const dataFim =
      updateParams.dataFim === undefined ? this.dataFim : updateParams.dataFim;
    if (
      !nome ||
      posicao < 0 ||
      !EstagioEntity.isDateRangeValid(dataInicio, dataFim)
    )
      throw new CronogramaDomainException({
        code: ErrorCodeConstants.CRONOGRAMA_INVALID_INPUT,
      });
    if (
      updateParams.estagioPaiId !== undefined &&
      updateParams.estagioPaiId === this.id
    )
      throw new CronogramaDomainException({
        code: ErrorCodeConstants.CRONOGRAMA_ESTAGIO_PAI_INVALID,
      });
    return new EstagioEntity({
      ...this.props,
      nome,
      posicao,
      dataInicio,
      dataFim,
      responsavelUsuarioId:
        updateParams.responsavelUsuarioId === undefined
          ? this.responsavelUsuarioId
          : updateParams.responsavelUsuarioId,
      estagioPaiId:
        updateParams.estagioPaiId === undefined
          ? this.estagioPaiId
          : updateParams.estagioPaiId,
      atualizadoEm: new Date(),
    });
  }

  private static isDateRangeValid(
    dataInicio?: string | null,
    dataFim?: string | null,
  ): boolean {
    if (!dataInicio || !dataFim) return true;
    const inicio = Date.parse(dataInicio);
    const fim = Date.parse(dataFim);
    return !Number.isNaN(inicio) && !Number.isNaN(fim) && fim >= inicio;
  }
  concluir(): EstagioEntity {
    return new EstagioEntity({
      ...this.props,
      status: EstagioStatus.CONCLUIDO,
      percentualDireto: 100,
      atualizadoEm: new Date(),
    });
  }
  assumir(responsavelUsuarioId: string): EstagioEntity {
    return new EstagioEntity({
      ...this.props,
      status: EstagioStatus.EM_ANDAMENTO,
      responsavelUsuarioId,
      atualizadoEm: new Date(),
    });
  }
  duplicar(posicao: number): EstagioEntity {
    if (posicao < 0)
      throw new CronogramaDomainException({
        code: ErrorCodeConstants.CRONOGRAMA_INVALID_INPUT,
      });
    const now = new Date();
    return new EstagioEntity({
      ...this.props,
      id: randomUUID(),
      posicao,
      status: EstagioStatus.PENDENTE,
      percentualDireto: null,
      estagioPaiId: this.estagioPaiId,
      criadoEm: now,
      atualizadoEm: now,
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
  get estagioPaiId() {
    return this.props.estagioPaiId;
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
