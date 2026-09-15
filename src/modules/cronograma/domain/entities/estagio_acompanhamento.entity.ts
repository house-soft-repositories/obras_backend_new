import { randomUUID } from 'node:crypto';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import CronogramaDomainException from '@/modules/cronograma/exceptions/cronograma_domain.exception';

export interface EstagioAcompanhamentoProps {
  id: string;
  tenantId: string;
  obraId: string;
  estagioId: string;
  percentual: number;
  data: string;
  observacao: string | null;
  autorUsuarioId: string;
  criadoEm: Date;
}

export default class EstagioAcompanhamentoEntity {
  private constructor(private readonly props: EstagioAcompanhamentoProps) {}

  static create(
    props: Omit<EstagioAcompanhamentoProps, 'id' | 'observacao' | 'criadoEm'> &
      Partial<Pick<EstagioAcompanhamentoProps, 'observacao'>>,
  ): EstagioAcompanhamentoEntity {
    if (props.percentual < 0 || props.percentual > 100) {
      throw new CronogramaDomainException({
        code: ErrorCodeConstants.CRONOGRAMA_INVALID_INPUT,
      });
    }
    return new EstagioAcompanhamentoEntity({
      ...props,
      id: randomUUID(),
      observacao: props.observacao?.trim() || null,
      criadoEm: new Date(),
    });
  }

  static fromData(
    props: EstagioAcompanhamentoProps,
  ): EstagioAcompanhamentoEntity {
    return new EstagioAcompanhamentoEntity(props);
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
  get estagioId() {
    return this.props.estagioId;
  }
  get percentual() {
    return this.props.percentual;
  }
  get data() {
    return this.props.data;
  }
  get observacao() {
    return this.props.observacao;
  }
  get autorUsuarioId() {
    return this.props.autorUsuarioId;
  }
  get criadoEm() {
    return this.props.criadoEm;
  }
  toObject() {
    return { ...this.props };
  }
}
