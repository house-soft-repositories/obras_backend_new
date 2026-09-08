import { randomUUID } from 'node:crypto';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import PessoaDomainException from '@/modules/pessoas/exceptions/pessoa_domain.exception';

export interface PessoaProps {
  id: string;
  tenantId: string;
  tipo: string;
  documento: string;
  nome: string;
  nomeFantasia: string | null;
  rg: string | null;
  orgaoExpedidor: string | null;
  email: string | null;
  telefone: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export type CreatePessoaProps = Omit<PessoaProps,'id'|'createdAt'|'updatedAt'|'ativo'> & {ativo?:boolean};
export default class PessoaEntity {
  private constructor(private readonly props: PessoaProps){}
  static create(p:CreatePessoaProps):PessoaEntity{
    if(!p.tipo) throw new PessoaDomainException({code:ErrorCodeConstants.PESSOA_INVALID_TIPO});
    if(!p.documento || !/^\d{11,14}$/.test(p.documento.replace(/\D/g,''))) throw new PessoaDomainException({code:ErrorCodeConstants.PESSOA_INVALID_DOCUMENTO});
    if(!p.nome?.trim() || p.nome.trim().length<2) throw new PessoaDomainException({code:ErrorCodeConstants.PESSOA_INVALID_NOME});
    const now=new Date();
    const digits=p.documento.replace(/\D/g,'');
    return new PessoaEntity({ id:randomUUID(), tenantId:p.tenantId, tipo:p.tipo, documento:digits, nome:p.nome.trim(), nomeFantasia:p.nomeFantasia?.trim()||null, rg:p.rg?.trim()||null, orgaoExpedidor:p.orgaoExpedidor?.trim()||null, email:p.email?.trim()||null, telefone:p.telefone?.trim()||null, cep:p.cep?.trim()||null, logradouro:p.logradouro?.trim()||null, numero:p.numero?.trim()||null, complemento:p.complemento?.trim()||null, bairro:p.bairro?.trim()||null, cidade:p.cidade?.trim()||null, uf:p.uf? p.uf.trim().toUpperCase():null, ativo:p.ativo??true, createdAt:now, updatedAt:now });
  }
  static fromData(p:PessoaProps):PessoaEntity{ return new PessoaEntity(p); }
  toObject():PessoaProps{ return {...this.props}; }
  get id(){return this.props.id;} get tenantId(){return this.props.tenantId;} get tipo(){return this.props.tipo;} get documento(){return this.props.documento;} get nome(){return this.props.nome;} get createdAt(){return this.props.createdAt;} get updatedAt(){return this.props.updatedAt;}
}
