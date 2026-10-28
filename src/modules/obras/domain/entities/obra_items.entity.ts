import { randomUUID } from 'node:crypto';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import ObraDomainException from '@/modules/obras/exceptions/obra_domain.exception';
import { ObraResponsavelTipo } from '@/modules/obras/domain/enums/obra_responsavel_tipo.enum';

export interface ObraResponsavelProps {
  id: string;
  tenantId: string;
  obraId: string;
  usuarioId: string;
  tipo: ObraResponsavelTipo;
  createdAt: Date;
}
export interface ObraOrcamentoProps {
  id: string;
  tenantId: string;
  obraId: string;
  fonteId: string;
  valor: string;
}
export interface ObraSeguidorProps {
  id: string;
  tenantId: string;
  obraId: string;
  usuarioId: string;
  seguidoEm: Date;
}
export class ObraResponsavelEntity {
  private constructor(private readonly props: ObraResponsavelProps) {}
  static createResponsible(p: {
    tenantId: string;
    obraId: string;
    usuarioId: string;
    role: UserRole;
  }): ObraResponsavelEntity {
    if (p.role !== UserRole.STAFF)
      throw new ObraDomainException({
        code: ErrorCodeConstants.OBRA_INVALID_RESPONSAVEL,
      });
    return new ObraResponsavelEntity({
      id: randomUUID(),
      tenantId: p.tenantId,
      obraId: p.obraId,
      usuarioId: p.usuarioId,
      tipo: ObraResponsavelTipo.RESPONSAVEL,
      createdAt: new Date(),
    });
  }
  static fromData(p: ObraResponsavelProps) {
    return new ObraResponsavelEntity(p);
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
  get usuarioId() {
    return this.props.usuarioId;
  }
  get tipo() {
    return this.props.tipo;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  toObject() {
    return { ...this.props };
  }
}
export class ObraOrcamentoPrevistoEntity {
  private constructor(private readonly props: ObraOrcamentoProps) {}
  static create(p: {
    tenantId: string;
    obraId: string;
    fonteId: string;
    valor: string;
  }): ObraOrcamentoPrevistoEntity {
    return new ObraOrcamentoPrevistoEntity({ id: randomUUID(), ...p });
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
  get fonteId() {
    return this.props.fonteId;
  }
  get valor() {
    return this.props.valor;
  }
  toObject() {
    return { ...this.props };
  }
}
export class ObraSeguidorEntity {
  private constructor(private readonly props: ObraSeguidorProps) {}
  static create(p: {
    tenantId: string;
    obraId: string;
    usuarioId: string;
  }): ObraSeguidorEntity {
    return new ObraSeguidorEntity({
      id: randomUUID(),
      tenantId: p.tenantId,
      obraId: p.obraId,
      usuarioId: p.usuarioId,
      seguidoEm: new Date(),
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
  get usuarioId() {
    return this.props.usuarioId;
  }
  get seguidoEm() {
    return this.props.seguidoEm;
  }
  toObject() {
    return { ...this.props };
  }
}
