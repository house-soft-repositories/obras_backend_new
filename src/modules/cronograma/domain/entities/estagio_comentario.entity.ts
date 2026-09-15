import { randomUUID } from 'node:crypto';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import CronogramaDomainException from '@/modules/cronograma/exceptions/cronograma_domain.exception';

export interface EstagioComentarioProps {
  id: string;
  tenantId: string;
  obraId: string;
  estagioId: string;
  texto: string;
  autorUsuarioId: string;
  criadoEm: Date;
}

export default class EstagioComentarioEntity {
  private constructor(private readonly props: EstagioComentarioProps) {}

  static create(
    props: Omit<EstagioComentarioProps, 'id' | 'criadoEm'>,
  ): EstagioComentarioEntity {
    const texto = props.texto.trim();
    if (!texto)
      throw new CronogramaDomainException({
        code: ErrorCodeConstants.CRONOGRAMA_INVALID_INPUT,
      });
    return new EstagioComentarioEntity({
      ...props,
      texto,
      id: randomUUID(),
      criadoEm: new Date(),
    });
  }

  static fromData(props: EstagioComentarioProps): EstagioComentarioEntity {
    return new EstagioComentarioEntity(props);
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
  get texto() {
    return this.props.texto;
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
