import { randomUUID } from 'node:crypto';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import ProfissionalTecnicoDomainException from '@/modules/pessoas/exceptions/profissional_tecnico_domain.exception';

export const CONSELHOS_PROFISSIONAIS = ['CREA', 'CAU', 'CFT'] as const;
export type ConselhoProfissional = (typeof CONSELHOS_PROFISSIONAIS)[number];

export interface ProfissionalTecnicoProps {
  id: string;
  pessoaId: string;
  conselho: ConselhoProfissional;
  numeroRegistro: string;
  ufRegistro: string | null;
  titulo: string | null;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateProfissionalTecnicoProps = Omit<
  ProfissionalTecnicoProps,
  'id' | 'createdAt' | 'updatedAt' | 'ativo'
> & {
  ativo?: boolean;
};

export type UpdateProfissionalTecnicoProps = Partial<
  Omit<CreateProfissionalTecnicoProps, 'pessoaId'>
>;

export interface ProfissionalTecnicoComPessoaProps
  extends ProfissionalTecnicoProps {
  nome: string;
  documento: string;
  registro: string;
}

export default class ProfissionalTecnicoEntity {
  private constructor(private readonly props: ProfissionalTecnicoProps) {}

  static create(props: CreateProfissionalTecnicoProps): ProfissionalTecnicoEntity {
    this.validate(props);
    const now = new Date();
    return new ProfissionalTecnicoEntity({
      id: randomUUID(),
      pessoaId: props.pessoaId,
      conselho: props.conselho,
      numeroRegistro: props.numeroRegistro.trim(),
      ufRegistro: props.ufRegistro ? props.ufRegistro.trim().toUpperCase() : null,
      titulo: props.titulo?.trim() || null,
      ativo: props.ativo ?? true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromData(props: ProfissionalTecnicoProps): ProfissionalTecnicoEntity {
    return new ProfissionalTecnicoEntity(props);
  }

  update(props: UpdateProfissionalTecnicoProps): ProfissionalTecnicoEntity {
    const merged = ProfissionalTecnicoEntity.create({
      pessoaId: this.pessoaId,
      conselho: props.conselho ?? this.conselho,
      numeroRegistro: props.numeroRegistro ?? this.numeroRegistro,
      ufRegistro:
        props.ufRegistro === undefined ? this.ufRegistro : props.ufRegistro,
      titulo: props.titulo === undefined ? this.titulo : props.titulo,
      ativo: props.ativo ?? this.ativo,
    });
    return ProfissionalTecnicoEntity.fromData({
      ...merged.toObject(),
      id: this.id,
      createdAt: this.createdAt,
    });
  }

  toObject(): ProfissionalTecnicoProps {
    return { ...this.props };
  }

  get id() {
    return this.props.id;
  }
  get pessoaId() {
    return this.props.pessoaId;
  }
  get conselho() {
    return this.props.conselho;
  }
  get numeroRegistro() {
    return this.props.numeroRegistro;
  }
  get ufRegistro() {
    return this.props.ufRegistro;
  }
  get titulo() {
    return this.props.titulo;
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

  private static validate(props: CreateProfissionalTecnicoProps): void {
    if (!props.pessoaId?.trim()) {
      throw new ProfissionalTecnicoDomainException({
        code: ErrorCodeConstants.PROFISSIONAL_TECNICO_INVALID_PESSOA,
      });
    }
    if (!CONSELHOS_PROFISSIONAIS.includes(props.conselho)) {
      throw new ProfissionalTecnicoDomainException({
        code: ErrorCodeConstants.PROFISSIONAL_TECNICO_INVALID_CONSELHO,
      });
    }
    if (!props.numeroRegistro?.trim()) {
      throw new ProfissionalTecnicoDomainException({
        code: ErrorCodeConstants.PROFISSIONAL_TECNICO_INVALID_NUMERO_REGISTRO,
      });
    }
  }
}
