import { randomUUID } from 'node:crypto';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { TipoLocalidade } from '@/modules/localidades/domain/enums/tipo_localidade.enum';
import LocalidadeDomainException from '@/modules/localidades/exceptions/localidade_domain.exception';

export interface LocalidadeProps {
  id: string;
  nome: string;
  uf: string;
  codigoIbge: string | null;
  tipo: TipoLocalidade | null;
  municipio: string | null;
  observacoes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateLocalidadeProps = Omit<
  LocalidadeProps,
  'id' | 'createdAt' | 'updatedAt'
>;

export type UpdateLocalidadeProps = Partial<CreateLocalidadeProps>;

export default class LocalidadeEntity {
  private constructor(private readonly props: LocalidadeProps) {}

  static create(props: CreateLocalidadeProps): LocalidadeEntity {
    this.validate(props);
    const now = new Date();
    return new LocalidadeEntity({
      ...props,
      id: randomUUID(),
      nome: props.nome.trim(),
      uf: props.uf.toUpperCase(),
      codigoIbge: props.codigoIbge?.trim() || null,
      municipio: props.municipio?.trim() || null,
      observacoes: props.observacoes?.trim() || null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromData(props: LocalidadeProps): LocalidadeEntity {
    return new LocalidadeEntity(props);
  }

  update(props: UpdateLocalidadeProps): LocalidadeEntity {
    const updated = LocalidadeEntity.create({
      nome: props.nome ?? this.nome,
      uf: props.uf ?? this.uf,
      codigoIbge:
        props.codigoIbge === undefined ? this.codigoIbge : props.codigoIbge,
      tipo: props.tipo === undefined ? this.tipo : props.tipo,
      municipio: props.municipio === undefined ? this.municipio : props.municipio,
      observacoes:
        props.observacoes === undefined ? this.observacoes : props.observacoes,
    });
    return LocalidadeEntity.fromData({
      ...updated.toObject(),
      id: this.id,
      createdAt: this.createdAt,
    });
  }

  private static validate(props: CreateLocalidadeProps): void {
    if (!props.nome?.trim()) {
      throw new LocalidadeDomainException({
        code: ErrorCodeConstants.LOCALIDADE_INVALID_NAME,
      });
    }
    if (!/^[A-Za-z]{2}$/.test(props.uf)) {
      throw new LocalidadeDomainException({
        code: ErrorCodeConstants.LOCALIDADE_INVALID_UF,
      });
    }
    if (props.tipo && !Object.values(TipoLocalidade).includes(props.tipo)) {
      throw new LocalidadeDomainException({
        code: ErrorCodeConstants.LOCALIDADE_INVALID_TYPE,
      });
    }
  }

  toObject(): LocalidadeProps {
    return { ...this.props };
  }

  get id() { return this.props.id; }
  get nome() { return this.props.nome; }
  get uf() { return this.props.uf; }
  get codigoIbge() { return this.props.codigoIbge; }
  get tipo() { return this.props.tipo; }
  get municipio() { return this.props.municipio; }
  get observacoes() { return this.props.observacoes; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }
}
