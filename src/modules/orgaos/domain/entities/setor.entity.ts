import { randomUUID } from 'node:crypto';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import SetorDomainException from '@/modules/orgaos/exceptions/setor_domain.exception';

export interface SetorProps {
  id: string;
  orgaoId: string;
  nome: string;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateSetorProps = Omit<
  SetorProps,
  'id' | 'ativo' | 'createdAt' | 'updatedAt'
> & {
  ativo?: boolean;
};

export type UpdateSetorProps = Partial<CreateSetorProps>;

export default class SetorEntity {
  private constructor(private readonly props: SetorProps) {}

  static create(props: CreateSetorProps): SetorEntity {
    this.validate(props);
    const now = new Date();
    return new SetorEntity({
      id: randomUUID(),
      orgaoId: props.orgaoId,
      nome: props.nome.trim(),
      ativo: props.ativo ?? true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromData(props: SetorProps): SetorEntity {
    return new SetorEntity(props);
  }

  update(props: UpdateSetorProps): SetorEntity {
    const updated = SetorEntity.create({
      orgaoId: props.orgaoId ?? this.orgaoId,
      nome: props.nome ?? this.nome,
      ativo: props.ativo ?? this.ativo,
    });
    return SetorEntity.fromData({
      ...updated.toObject(),
      id: this.id,
      createdAt: this.createdAt,
    });
  }

  private static validate(props: CreateSetorProps): void {
    if (!props.nome?.trim()) {
      throw new SetorDomainException({
        code: ErrorCodeConstants.SETOR_INVALID_NAME,
      });
    }
    if (!this.isUuid(props.orgaoId)) {
      throw new SetorDomainException({
        code: ErrorCodeConstants.SETOR_INVALID_ORGAO,
      });
    }
  }

  private static isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value);
  }

  toObject(): SetorProps {
    return { ...this.props };
  }

  get id() {
    return this.props.id;
  }
  get orgaoId() {
    return this.props.orgaoId;
  }
  get nome() {
    return this.props.nome;
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
