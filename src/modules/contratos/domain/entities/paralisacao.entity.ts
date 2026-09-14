import { randomUUID } from 'node:crypto';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import ParalisacaoDomainException from '@/modules/contratos/exceptions/paralisacao_domain.exception';
export interface ParalisacaoProps {
  id: string;
  tenantId: string;
  contratoId: string;
  dataParalisacao: string;
  motivo: string;
  termoParalisacaoArquivoId: string;
  dataReinicio: string | null;
  termoRetomadaArquivoId: string | null;
  diasParados: number | null;
  createdAt: Date;
  updatedAt: Date;
}
export default class ParalisacaoEntity {
  private constructor(private props: ParalisacaoProps) {}
  static create(p: {
    tenantId: string;
    contratoId: string;
    dataParalisacao: string;
    motivo: string;
    termoParalisacaoArquivoId: string;
  }): ParalisacaoEntity {
    if (!p.dataParalisacao)
      throw new ParalisacaoDomainException({
        code: ErrorCodeConstants.PARALISACAO_NOT_FOUND,
      });
    const motivo = p.motivo?.trim();
    if (!motivo)
      throw new ParalisacaoDomainException({
        code: ErrorCodeConstants.PARALISACAO_NOT_FOUND,
      });
    if (!p.termoParalisacaoArquivoId)
      throw new ParalisacaoDomainException({
        code: ErrorCodeConstants.PARALISACAO_NOT_FOUND,
      });
    const now = new Date();
    return new ParalisacaoEntity({
      id: randomUUID(),
      tenantId: p.tenantId,
      contratoId: p.contratoId,
      dataParalisacao: p.dataParalisacao,
      motivo,
      termoParalisacaoArquivoId: p.termoParalisacaoArquivoId,
      dataReinicio: null,
      termoRetomadaArquivoId: null,
      diasParados: null,
      createdAt: now,
      updatedAt: now,
    });
  }
  static fromData(p: ParalisacaoProps): ParalisacaoEntity {
    return new ParalisacaoEntity(p);
  }
  reiniciar(dataReinicio: string, termoRetomadaArquivoId?: string | null) {
    if (!dataReinicio)
      throw new ParalisacaoDomainException({
        code: ErrorCodeConstants.PARALISACAO_INVALID_REINICIO,
      });
    if (
      new Date(dataReinicio).getTime() <=
      new Date(this.props.dataParalisacao).getTime()
    )
      throw new ParalisacaoDomainException({
        code: ErrorCodeConstants.PARALISACAO_INVALID_REINICIO,
      });
    const diff = Math.round(
      (new Date(dataReinicio).getTime() -
        new Date(this.props.dataParalisacao).getTime()) /
        86400000,
    );
    this.props.dataReinicio = dataReinicio;
    this.props.termoRetomadaArquivoId = termoRetomadaArquivoId || null;
    this.props.diasParados = diff;
    this.props.updatedAt = new Date();
  }
  toObject(): ParalisacaoProps {
    return { ...this.props };
  }
  get id() {
    return this.props.id;
  }
  get tenantId() {
    return this.props.tenantId;
  }
  get contratoId() {
    return this.props.contratoId;
  }
  get dataParalisacao() {
    return this.props.dataParalisacao;
  }
  get dataReinicio() {
    return this.props.dataReinicio;
  }
  get diasParados() {
    return this.props.diasParados;
  }
}
