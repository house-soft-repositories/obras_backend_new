import { randomUUID } from 'node:crypto';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { TipoOrgao } from '@/modules/orgaos/domain/enums/tipo_orgao.enum';
import OrgaoDomainException from '@/modules/orgaos/exceptions/orgao_domain.exception';

export interface OrgaoProps {
  id: string;
  localidadeId: string;
  nome: string;
  sigla: string | null;
  tipo: TipoOrgao | null;
  responsavel: string | null;
  email: string | null;
  telefone: string | null;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateOrgaoProps = Omit<
  OrgaoProps,
  'id' | 'ativo' | 'createdAt' | 'updatedAt'
> & {
  ativo?: boolean;
};

export type UpdateOrgaoProps = Partial<CreateOrgaoProps>;

export default class OrgaoEntity {
  private constructor(private readonly props: OrgaoProps) {}

  static create(props: CreateOrgaoProps): OrgaoEntity {
    this.validate(props);
    const now = new Date();
    return new OrgaoEntity({
      id: randomUUID(),
      localidadeId: props.localidadeId,
      nome: props.nome.trim(),
      sigla: props.sigla?.trim() || null,
      tipo: props.tipo,
      responsavel: props.responsavel?.trim() || null,
      email: props.email?.trim().toLowerCase() || null,
      telefone: props.telefone?.trim() || null,
      ativo: props.ativo ?? true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromData(props: OrgaoProps): OrgaoEntity {
    return new OrgaoEntity(props);
  }

  update(props: UpdateOrgaoProps): OrgaoEntity {
    const updated = OrgaoEntity.create({
      localidadeId: props.localidadeId ?? this.localidadeId,
      nome: props.nome ?? this.nome,
      sigla: props.sigla === undefined ? this.sigla : props.sigla,
      tipo: props.tipo === undefined ? this.tipo : props.tipo,
      responsavel:
        props.responsavel === undefined ? this.responsavel : props.responsavel,
      email: props.email === undefined ? this.email : props.email,
      telefone: props.telefone === undefined ? this.telefone : props.telefone,
      ativo: props.ativo ?? this.ativo,
    });
    return OrgaoEntity.fromData({
      ...updated.toObject(),
      id: this.id,
      createdAt: this.createdAt,
    });
  }

  private static validate(props: CreateOrgaoProps): void {
    if (!props.nome?.trim()) {
      throw new OrgaoDomainException({
        code: ErrorCodeConstants.ORGAO_INVALID_NAME,
      });
    }
    if (!this.isUuid(props.localidadeId)) {
      throw new OrgaoDomainException({
        code: ErrorCodeConstants.ORGAO_INVALID_LOCALIDADE,
      });
    }
    if (props.tipo && !Object.values(TipoOrgao).includes(props.tipo)) {
      throw new OrgaoDomainException({
        code: ErrorCodeConstants.ORGAO_INVALID_TYPE,
      });
    }
    if (
      props.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(props.email.trim())
    ) {
      throw new OrgaoDomainException({
        code: ErrorCodeConstants.ORGAO_INVALID_EMAIL,
      });
    }
  }

  private static isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value);
  }

  toObject(): OrgaoProps {
    return { ...this.props };
  }

  get id() {
    return this.props.id;
  }
  get localidadeId() {
    return this.props.localidadeId;
  }
  get nome() {
    return this.props.nome;
  }
  get sigla() {
    return this.props.sigla;
  }
  get tipo() {
    return this.props.tipo;
  }
  get responsavel() {
    return this.props.responsavel;
  }
  get email() {
    return this.props.email;
  }
  get telefone() {
    return this.props.telefone;
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
