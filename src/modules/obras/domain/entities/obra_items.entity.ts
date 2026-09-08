import { randomUUID } from 'node:crypto';
export interface ObraResponsavelProps { id:string; tenantId:string; obraId:string; usuarioId:string; tipo:string; createdAt:Date; }
export interface ObraOrcamentoProps { id:string; tenantId:string; obraId:string; fonteId:string; valor:string; }
export interface ObraSeguidorProps { id:string; tenantId:string; obraId:string; usuarioId:string; seguidoEm:Date; }
export class ObraResponsavelEntity {
  private constructor(private readonly props:ObraResponsavelProps){}
  static createResponsible(p:{tenantId:string;obraId:string;usuarioId:string}):ObraResponsavelEntity{ return new ObraResponsavelEntity({id:randomUUID(),tenantId:p.tenantId,obraId:p.obraId,usuarioId:p.usuarioId,tipo:'RESPONSAVEL',createdAt:new Date()}); }
  static fromData(p:ObraResponsavelProps){ return new ObraResponsavelEntity(p); }
  toObject(){ return {...this.props}; }
}
export class ObraOrcamentoPrevistoEntity {
  private constructor(private readonly props:ObraOrcamentoProps){}
  static create(p:{tenantId:string;obraId:string;fonteId:string;valor:string}):ObraOrcamentoPrevistoEntity{ return new ObraOrcamentoPrevistoEntity({id:randomUUID(),...p}); }
  toObject(){ return {...this.props}; }
}
export class ObraSeguidorEntity {
  private constructor(private readonly props:ObraSeguidorProps){}
  static create(p:{tenantId:string;obraId:string;usuarioId:string}):ObraSeguidorEntity{ return new ObraSeguidorEntity({id:randomUUID(),tenantId:p.tenantId,obraId:p.obraId,usuarioId:p.usuarioId,seguidoEm:new Date()}); }
  toObject(){ return {...this.props}; }
}
