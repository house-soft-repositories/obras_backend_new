import { randomUUID } from 'node:crypto';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import ObraPrivadaDomainException from '@/modules/obras-privadas/exceptions/obra_privada_domain.exception';
export interface ObraPrivadaProps { id:string; tenantId:string; codigo:string; descricao:string; observacoes:string|null; proprietarioPessoaId:string; orgaoId:string|null; inscricaoImobiliaria:string|null; matriculaRgi:string|null; cartorio:string|null; cep:string|null; logradouro:string; numero:string|null; complemento:string|null; bairro:string|null; localidadeId:string|null; uf:string; latitude:string|null; longitude:string|null; geoOrigem:string|null; situacaoAlvara:string; andamento:string|null; habiteSe:string|null; dataInicio:string|null; dataPrevistaConclusao:string|null; createdAt:Date; updatedAt:Date; deletedAt:Date|null; }
export type CreateObraPrivadaProps = { tenantId:string; codigo:string; descricao:string; observacoes?:string|null; proprietarioPessoaId:string; orgaoId?:string|null; inscricaoImobiliaria?:string|null; matriculaRgi?:string|null; cartorio?:string|null; cep?:string|null; logradouro:string; numero?:string|null; complemento?:string|null; bairro?:string|null; localidadeId?:string|null; uf:string; latitude?:string|null; longitude?:string|null; geoOrigem?:string|null; situacaoAlvara?:string; andamento?:string|null; habiteSe?:string|null; dataInicio?:string|null; dataPrevistaConclusao?:string|null; };
const ALVARA=['SEM_ALVARA','COM_ALVARA_VIGENTE','COM_ALVARA_VENCIDO','DISPENSADA'];
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
  toObject():ObraPrivadaProps{ return {...this.props}; }
  get id(){return this.props.id;} get codigo(){return this.props.codigo;}
}
