import { randomUUID } from 'node:crypto';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import FonteDomainException from '@/modules/fontes/exceptions/fonte_domain.exception';

export interface FonteProps {
  id: string;
  nome: string;
  descricao: string | null;
  codigo: string | null;
  tipo: string | null;
  valorPrevisto: string | null;
  vigencia: string | null;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateFonteProps = Omit<
  FonteProps,
  'id' | 'createdAt' | 'updatedAt' | 'ativo'
> & {
  ativo?: boolean;
};

export default class FonteEntity {
  private constructor(private readonly props: FonteProps) {}

  static create(props: CreateFonteProps): FonteEntity {
    if (!props.nome?.trim())
      throw new FonteDomainException({
        code: ErrorCodeConstants.FONTE_INVALID_NAME,
      });
    const now = new Date();
    return new FonteEntity({
      id: randomUUID(),
      nome: props.nome.trim(),
      descricao: props.descricao?.trim() || null,
      codigo: props.codigo?.trim() || null,
      tipo: props.tipo || null,
      valorPrevisto: props.valorPrevisto || null,
      vigencia: props.vigencia?.trim() || null,
      ativo: props.ativo ?? true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromData(props: FonteProps): FonteEntity {
    return new FonteEntity(props);
  }
  toObject(): FonteProps {
    return { ...this.props };
  }
  get id() {
    return this.props.id;
  }
  get nome() {
    return this.props.nome;
  }
  get descricao() {
    return this.props.descricao;
  }
  get codigo() {
    return this.props.codigo;
  }
  get tipo() {
    return this.props.tipo;
  }
  get valorPrevisto() {
    return this.props.valorPrevisto;
  }
  get vigencia() {
    return this.props.vigencia;
  }
  get ativo() {
    return this.props.ativo;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }
}
