import ErrorCodeConstants from '@/core/constants/error_code.constants';
import CadastroDomainException from '@/modules/obras/exceptions/cadastro_domain.exception';
import { randomUUID } from 'node:crypto';

export interface CadastroProps {
  id: string;
  tenantId: string;
  nome: string;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubclassificacaoProps extends CadastroProps {
  classificacaoId: string;
}

export interface SubtipologiaProps extends CadastroProps {
  tipologiaId: string;
}

function validateNome(nome: string): string {
  const n = nome?.trim();
  if (!n || n.length < 2)
    throw new CadastroDomainException({
      code: ErrorCodeConstants.CADASTRO_INVALID_NOME,
    });
  return n;
}

export class EixoEntity {
  private constructor(private readonly props: CadastroProps) {}
  static create(p: { tenantId: string; nome: string }): EixoEntity {
    const nome = validateNome(p.nome);
    const now = new Date();
    return new EixoEntity({
      id: randomUUID(),
      tenantId: p.tenantId,
      nome,
      ativo: true,
      createdAt: now,
      updatedAt: now,
    });
  }
  static fromData(p: CadastroProps): EixoEntity {
    return new EixoEntity(p);
  }
  update(p: { nome?: string; ativo?: boolean }): void {
    if (p.nome !== undefined)
      (this.props as { nome: string }).nome = validateNome(p.nome);
    if (p.ativo !== undefined)
      (this.props as { ativo: boolean }).ativo = p.ativo;
    (this.props as { updatedAt: Date }).updatedAt = new Date();
  }
  toObject(): CadastroProps {
    return { ...this.props };
  }
  get id() {
    return this.props.id;
  }
  get tenantId() {
    return this.props.tenantId;
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

export class ClassificacaoEntity {
  private constructor(private readonly props: CadastroProps) {}
  static create(p: { tenantId: string; nome: string }): ClassificacaoEntity {
    const nome = validateNome(p.nome);
    const now = new Date();
    return new ClassificacaoEntity({
      id: randomUUID(),
      tenantId: p.tenantId,
      nome,
      ativo: true,
      createdAt: now,
      updatedAt: now,
    });
  }
  static fromData(p: CadastroProps): ClassificacaoEntity {
    return new ClassificacaoEntity(p);
  }
  update(p: { nome?: string; ativo?: boolean }): void {
    if (p.nome !== undefined)
      (this.props as { nome: string }).nome = validateNome(p.nome);
    if (p.ativo !== undefined)
      (this.props as { ativo: boolean }).ativo = p.ativo;
    (this.props as { updatedAt: Date }).updatedAt = new Date();
  }
  toObject(): CadastroProps {
    return { ...this.props };
  }
  get id() {
    return this.props.id;
  }
  get tenantId() {
    return this.props.tenantId;
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

export class SubclassificacaoEntity {
  private constructor(private readonly props: SubclassificacaoProps) {}
  static create(p: {
    tenantId: string;
    classificacaoId: string;
    nome: string;
  }): SubclassificacaoEntity {
    const nome = validateNome(p.nome);
    if (!p.classificacaoId)
      throw new CadastroDomainException({
        code: ErrorCodeConstants.CADASTRO_PARENT_NOT_FOUND,
      });
    const now = new Date();
    return new SubclassificacaoEntity({
      id: randomUUID(),
      tenantId: p.tenantId,
      classificacaoId: p.classificacaoId,
      nome,
      ativo: true,
      createdAt: now,
      updatedAt: now,
    });
  }
  static fromData(p: SubclassificacaoProps): SubclassificacaoEntity {
    return new SubclassificacaoEntity(p);
  }
  update(p: { nome?: string; ativo?: boolean }): void {
    if (p.nome !== undefined)
      (this.props as { nome: string }).nome = validateNome(p.nome);
    if (p.ativo !== undefined)
      (this.props as { ativo: boolean }).ativo = p.ativo;
    (this.props as { updatedAt: Date }).updatedAt = new Date();
  }
  toObject(): SubclassificacaoProps {
    return { ...this.props };
  }
  get id() {
    return this.props.id;
  }
  get tenantId() {
    return this.props.tenantId;
  }
  get classificacaoId() {
    return this.props.classificacaoId;
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

export class TipologiaEntity {
  private constructor(private readonly props: CadastroProps) {}
  static create(p: { tenantId: string; nome: string }): TipologiaEntity {
    const nome = validateNome(p.nome);
    const now = new Date();
    return new TipologiaEntity({
      id: randomUUID(),
      tenantId: p.tenantId,
      nome,
      ativo: true,
      createdAt: now,
      updatedAt: now,
    });
  }
  static fromData(p: CadastroProps): TipologiaEntity {
    return new TipologiaEntity(p);
  }
  update(p: { nome?: string; ativo?: boolean }): void {
    if (p.nome !== undefined)
      (this.props as { nome: string }).nome = validateNome(p.nome);
    if (p.ativo !== undefined)
      (this.props as { ativo: boolean }).ativo = p.ativo;
    (this.props as { updatedAt: Date }).updatedAt = new Date();
  }
  toObject(): CadastroProps {
    return { ...this.props };
  }
  get id() {
    return this.props.id;
  }
  get tenantId() {
    return this.props.tenantId;
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

export class SubtipologiaEntity {
  private constructor(private readonly props: SubtipologiaProps) {}
  static create(p: {
    tenantId: string;
    tipologiaId: string;
    nome: string;
  }): SubtipologiaEntity {
    const nome = validateNome(p.nome);
    if (!p.tipologiaId)
      throw new CadastroDomainException({
        code: ErrorCodeConstants.CADASTRO_PARENT_NOT_FOUND,
      });
    const now = new Date();
    return new SubtipologiaEntity({
      id: randomUUID(),
      tenantId: p.tenantId,
      tipologiaId: p.tipologiaId,
      nome,
      ativo: true,
      createdAt: now,
      updatedAt: now,
    });
  }
  static fromData(p: SubtipologiaProps): SubtipologiaEntity {
    return new SubtipologiaEntity(p);
  }
  update(p: { nome?: string; ativo?: boolean }): void {
    if (p.nome !== undefined)
      (this.props as { nome: string }).nome = validateNome(p.nome);
    if (p.ativo !== undefined)
      (this.props as { ativo: boolean }).ativo = p.ativo;
    (this.props as { updatedAt: Date }).updatedAt = new Date();
  }
  toObject(): SubtipologiaProps {
    return { ...this.props };
  }
  get id() {
    return this.props.id;
  }
  get tenantId() {
    return this.props.tenantId;
  }
  get tipologiaId() {
    return this.props.tipologiaId;
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
