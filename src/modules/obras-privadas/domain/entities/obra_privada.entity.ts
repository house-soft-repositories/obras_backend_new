import { randomUUID } from 'node:crypto';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import ObraPrivadaDomainException from '@/modules/obras-privadas/exceptions/obra_privada_domain.exception';
export interface ObraPrivadaProps { id:string; tenantId:string; codigo:string; descricao:string; observacoes:string|null; proprietarioPessoaId:string; orgaoId:string|null; inscricaoImobiliaria:string|null; matriculaRgi:string|null; cartorio:string|null; cep:string|null; logradouro:string; numero:string|null; complemento:string|null; bairro:string|null; localidadeId:string|null; uf:string; latitude:string|null; longitude:string|null; geoOrigem:string|null; situacaoAlvara:string; andamento:string|null; habiteSe:string|null; dataInicio:string|null; dataPrevistaConclusao:string|null; createdAt:Date; updatedAt:Date; deletedAt:Date|null; }
export type CreateObraPrivadaProps = { tenantId:string; codigo:string; descricao:string; observacoes?:string|null; proprietarioPessoaId:string; orgaoId?:string|null; inscricaoImobiliaria?:string|null; matriculaRgi?:string|null; cartorio?:string|null; cep?:string|null; logradouro:string; numero?:string|null; complemento?:string|null; bairro?:string|null; localidadeId?:string|null; uf:string; latitude?:string|null; longitude?:string|null; geoOrigem?:string|null; situacaoAlvara?:string; andamento?:string|null; habiteSe?:string|null; dataInicio?:string|null; dataPrevistaConclusao?:string|null; };
const ALVARA=['SEM_ALVARA','COM_ALVARA_VIGENTE','COM_ALVARA_VENCIDO','DISPENSADA'];
export type ObraPrivadaUpdate = Partial<
  Pick<
    ObraPrivadaProps,
    | 'descricao'
    | 'observacoes'
    | 'proprietarioPessoaId'
    | 'orgaoId'
    | 'inscricaoImobiliaria'
    | 'matriculaRgi'
    | 'cartorio'
    | 'cep'
    | 'logradouro'
    | 'numero'
    | 'complemento'
    | 'bairro'
    | 'localidadeId'
    | 'uf'
    | 'latitude'
    | 'longitude'
    | 'geoOrigem'
    | 'situacaoAlvara'
    | 'andamento'
    | 'habiteSe'
    | 'dataInicio'
    | 'dataPrevistaConclusao'
  >
>;
export default class ObraPrivadaEntity {
  private constructor(private readonly props:ObraPrivadaProps){}
  static create(p:CreateObraPrivadaProps):ObraPrivadaEntity{
    if(!p.descricao?.trim()) throw new ObraPrivadaDomainException({code:ErrorCodeConstants.OBRA_PRIVADA_INVALID_DESCRICAO});
    if(!p.proprietarioPessoaId) throw new ObraPrivadaDomainException({code:ErrorCodeConstants.OBRA_PRIVADA_INVALID_PROPRIETARIO});
    if(!p.logradouro?.trim()) throw new ObraPrivadaDomainException({code:ErrorCodeConstants.OBRA_PRIVADA_INVALID_LOGRADOURO});
    if(!p.uf||p.uf.trim().length!==2) throw new ObraPrivadaDomainException({code:ErrorCodeConstants.OBRA_PRIVADA_INVALID_UF});
    if(p.situacaoAlvara&&!ALVARA.includes(p.situacaoAlvara)) throw new ObraPrivadaDomainException({code:ErrorCodeConstants.OBRA_PRIVADA_INVALID_SITUACAO});
    const now=new Date();
    return new ObraPrivadaEntity({ id:randomUUID(), tenantId:p.tenantId, codigo:p.codigo, descricao:p.descricao.trim(), observacoes:p.observacoes?.trim()||null, proprietarioPessoaId:p.proprietarioPessoaId, orgaoId:p.orgaoId||null, inscricaoImobiliaria:p.inscricaoImobiliaria?.trim()||null, matriculaRgi:p.matriculaRgi?.trim()||null, cartorio:p.cartorio?.trim()||null, cep:p.cep?.trim()||null, logradouro:p.logradouro.trim(), numero:p.numero?.trim()||null, complemento:p.complemento?.trim()||null, bairro:p.bairro?.trim()||null, localidadeId:p.localidadeId||null, uf:p.uf.trim().toUpperCase(), latitude:p.latitude||null, longitude:p.longitude||null, geoOrigem:p.geoOrigem||null, situacaoAlvara:'SEM_ALVARA', andamento:p.andamento||null, habiteSe:p.habiteSe||null, dataInicio:p.dataInicio||null, dataPrevistaConclusao:p.dataPrevistaConclusao||null, createdAt:now, updatedAt:now, deletedAt:null });
  }
  static fromData(p:ObraPrivadaProps){ return new ObraPrivadaEntity(p); }
  editar(patch:ObraPrivadaUpdate):ObraPrivadaEntity{
    const next:ObraPrivadaProps = {...this.props};
    if(patch.descricao!==undefined){
      if(!patch.descricao?.trim()) throw new ObraPrivadaDomainException({code:ErrorCodeConstants.OBRA_PRIVADA_INVALID_DESCRICAO});
      next.descricao=patch.descricao.trim();
    }
    if(patch.observacoes!==undefined) next.observacoes=patch.observacoes?.trim()||null;
    if(patch.proprietarioPessoaId!==undefined){
      if(!patch.proprietarioPessoaId) throw new ObraPrivadaDomainException({code:ErrorCodeConstants.OBRA_PRIVADA_INVALID_PROPRIETARIO});
      next.proprietarioPessoaId=patch.proprietarioPessoaId;
    }
    if(patch.orgaoId!==undefined) next.orgaoId=patch.orgaoId||null;
    if(patch.inscricaoImobiliaria!==undefined) next.inscricaoImobiliaria=patch.inscricaoImobiliaria?.trim()||null;
    if(patch.matriculaRgi!==undefined) next.matriculaRgi=patch.matriculaRgi?.trim()||null;
    if(patch.cartorio!==undefined) next.cartorio=patch.cartorio?.trim()||null;
    if(patch.cep!==undefined) next.cep=patch.cep?.trim()||null;
    if(patch.logradouro!==undefined){
      if(!patch.logradouro?.trim()) throw new ObraPrivadaDomainException({code:ErrorCodeConstants.OBRA_PRIVADA_INVALID_LOGRADOURO});
      next.logradouro=patch.logradouro.trim();
    }
    if(patch.numero!==undefined) next.numero=patch.numero?.trim()||null;
    if(patch.complemento!==undefined) next.complemento=patch.complemento?.trim()||null;
    if(patch.bairro!==undefined) next.bairro=patch.bairro?.trim()||null;
    if(patch.localidadeId!==undefined) next.localidadeId=patch.localidadeId||null;
    if(patch.uf!==undefined){
      if(!patch.uf||patch.uf.trim().length!==2) throw new ObraPrivadaDomainException({code:ErrorCodeConstants.OBRA_PRIVADA_INVALID_UF});
      next.uf=patch.uf.trim().toUpperCase();
    }
    if(patch.latitude!==undefined) next.latitude=patch.latitude||null;
    if(patch.longitude!==undefined) next.longitude=patch.longitude||null;
    if(patch.geoOrigem!==undefined) next.geoOrigem=patch.geoOrigem||null;
    if(patch.situacaoAlvara!==undefined){
      if(!ALVARA.includes(patch.situacaoAlvara)) throw new ObraPrivadaDomainException({code:ErrorCodeConstants.OBRA_PRIVADA_INVALID_SITUACAO});
      next.situacaoAlvara=patch.situacaoAlvara;
    }
    if(patch.andamento!==undefined) next.andamento=patch.andamento||null;
    if(patch.habiteSe!==undefined) next.habiteSe=patch.habiteSe||null;
    if(patch.dataInicio!==undefined) next.dataInicio=patch.dataInicio||null;
    if(patch.dataPrevistaConclusao!==undefined) next.dataPrevistaConclusao=patch.dataPrevistaConclusao||null;
    next.updatedAt=new Date();
    return new ObraPrivadaEntity(next);
  }
  excluir():ObraPrivadaEntity{
    if(this.props.deletedAt) return this;
    const now=new Date();
    return new ObraPrivadaEntity({...this.props,deletedAt:now,updatedAt:now});
  }
  toObject():ObraPrivadaProps{ return {...this.props}; }
  get id(){return this.props.id;} get codigo(){return this.props.codigo;}
}
