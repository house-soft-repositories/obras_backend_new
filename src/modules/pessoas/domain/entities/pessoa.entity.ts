import { randomUUID } from 'node:crypto';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import PessoaDomainException from '@/modules/pessoas/exceptions/pessoa_domain.exception';

export const TIPOS_PESSOA = ['FISICA', 'JURIDICA'] as const;
export type TipoPessoa = (typeof TIPOS_PESSOA)[number];

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
export type UpdatePessoaProps = Partial<CreatePessoaProps>;
export default class PessoaEntity {
  private constructor(private readonly props: PessoaProps){}
  static create(p:CreatePessoaProps):PessoaEntity{
    if(!p.tipo || !(TIPOS_PESSOA as readonly string[]).includes(p.tipo)) throw new PessoaDomainException({code:ErrorCodeConstants.PESSOA_INVALID_TIPO});
    if(!p.documento || !/^\d{11,14}$/.test(p.documento.replace(/\D/g,''))) throw new PessoaDomainException({code:ErrorCodeConstants.PESSOA_INVALID_DOCUMENTO});
    if(!p.nome?.trim() || p.nome.trim().length<2) throw new PessoaDomainException({code:ErrorCodeConstants.PESSOA_INVALID_NOME});
    const now=new Date();
    const digits=p.documento.replace(/\D/g,'');
    return new PessoaEntity({ id:randomUUID(), tenantId:p.tenantId, tipo:p.tipo, documento:digits, nome:p.nome.trim(), nomeFantasia:p.nomeFantasia?.trim()||null, rg:p.rg?.trim()||null, orgaoExpedidor:p.orgaoExpedidor?.trim()||null, email:p.email?.trim()||null, telefone:p.telefone?.trim()||null, cep:p.cep?.trim()||null, logradouro:p.logradouro?.trim()||null, numero:p.numero?.trim()||null, complemento:p.complemento?.trim()||null, bairro:p.bairro?.trim()||null, cidade:p.cidade?.trim()||null, uf:p.uf? p.uf.trim().toUpperCase():null, ativo:p.ativo??true, createdAt:now, updatedAt:now });
  }
  static fromData(p:PessoaProps):PessoaEntity{ return new PessoaEntity(p); }
  update(p:UpdatePessoaProps):PessoaEntity{
    const merged = PessoaEntity.create({
      tenantId: p.tenantId ?? this.tenantId,
      tipo: p.tipo ?? this.tipo,
      documento: p.documento ?? this.documento,
      nome: p.nome ?? this.nome,
      nomeFantasia: p.nomeFantasia === undefined ? this.toObject().nomeFantasia : p.nomeFantasia,
      rg: p.rg === undefined ? this.toObject().rg : p.rg,
      orgaoExpedidor: p.orgaoExpedidor === undefined ? this.toObject().orgaoExpedidor : p.orgaoExpedidor,
      email: p.email === undefined ? this.toObject().email : p.email,
      telefone: p.telefone === undefined ? this.toObject().telefone : p.telefone,
      cep: p.cep === undefined ? this.toObject().cep : p.cep,
      logradouro: p.logradouro === undefined ? this.toObject().logradouro : p.logradouro,
      numero: p.numero === undefined ? this.toObject().numero : p.numero,
      complemento: p.complemento === undefined ? this.toObject().complemento : p.complemento,
      bairro: p.bairro === undefined ? this.toObject().bairro : p.bairro,
      cidade: p.cidade === undefined ? this.toObject().cidade : p.cidade,
      uf: p.uf === undefined ? this.toObject().uf : p.uf,
      ativo: p.ativo ?? this.toObject().ativo,
    });
    return PessoaEntity.fromData({ ...merged.toObject(), id: this.id, createdAt: this.createdAt });
  }
  toObject():PessoaProps{ return {...this.props}; }
  get id(){return this.props.id;} get tenantId(){return this.props.tenantId;} get tipo(){return this.props.tipo;} get documento(){return this.props.documento;} get nome(){return this.props.nome;} get nomeFantasia(){return this.props.nomeFantasia;} get rg(){return this.props.rg;} get orgaoExpedidor(){return this.props.orgaoExpedidor;} get email(){return this.props.email;} get telefone(){return this.props.telefone;} get cep(){return this.props.cep;} get logradouro(){return this.props.logradouro;} get numero(){return this.props.numero;} get complemento(){return this.props.complemento;} get bairro(){return this.props.bairro;} get cidade(){return this.props.cidade;} get uf(){return this.props.uf;} get ativo(){return this.props.ativo;} get createdAt(){return this.props.createdAt;} get updatedAt(){return this.props.updatedAt;}
}
