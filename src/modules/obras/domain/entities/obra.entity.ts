import { randomUUID } from 'node:crypto';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import ObraDomainException from '@/modules/obras/exceptions/obra_domain.exception';
export interface ObraProps { id:string; tenantId:string; codigo:string; nome:string; descricao:string|null; tipo:string; status:string; orgaoId:string; setorId:string|null; localidadeId:string|null; subclassificacaoId:string|null; eixoId:string|null; classificacaoId:string|null; tipologiaId:string|null; subtipologiaId:string|null; seguirAutomatico:boolean; criadoPorUsuarioId:string; createdAt:Date; updatedAt:Date; deletedAt:Date|null; }
export type CreateObraProps = { tenantId:string; codigo:string; nome:string; descricao?:string|null; tipo:string; orgaoId:string; setorId?:string|null; localidadeId?:string|null; subclassificacaoId?:string|null; eixoId?:string|null; classificacaoId?:string|null; tipologiaId?:string|null; subtipologiaId?:string|null; seguirAutomatico?:boolean; criadoPorUsuarioId:string; };
export default class ObraEntity {
  private constructor(private readonly props:ObraProps){}
  static create(p:CreateObraProps):ObraEntity{
    if(!p.nome?.trim()||p.nome.trim().length<2) throw new ObraDomainException({code:ErrorCodeConstants.OBRA_INVALID_NOME});
    if(!p.tipo) throw new ObraDomainException({code:ErrorCodeConstants.OBRA_INVALID_TIPO});
    if(!p.orgaoId) throw new ObraDomainException({code:ErrorCodeConstants.OBRA_INVALID_ORGAO});
    if(p.subclassificacaoId && p.tipo!=='OBRA') throw new ObraDomainException({code:ErrorCodeConstants.OBRA_INVALID_SUBCLASSIFICACAO});
    const now=new Date();
    return new ObraEntity({ id:randomUUID(), tenantId:p.tenantId, codigo:p.codigo, nome:p.nome.trim(), descricao:p.descricao?.trim()||null, tipo:p.tipo, status:'EM_ABERTO', orgaoId:p.orgaoId, setorId:p.setorId||null, localidadeId:p.localidadeId||null, subclassificacaoId:p.subclassificacaoId||null, eixoId:p.eixoId||null, classificacaoId:p.classificacaoId||null, tipologiaId:p.tipologiaId||null, subtipologiaId:p.subtipologiaId||null, seguirAutomatico:p.seguirAutomatico??false, criadoPorUsuarioId:p.criadoPorUsuarioId, createdAt:now, updatedAt:now, deletedAt:null });
  }
  static fromData(p:ObraProps):ObraEntity{ return new ObraEntity(p); }
  toObject():ObraProps{ return {...this.props}; }
  get id(){return this.props.id;} get codigo(){return this.props.codigo;} get nome(){return this.props.nome;} get tenantId(){return this.props.tenantId;}
}
