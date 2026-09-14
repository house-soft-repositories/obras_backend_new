import { randomUUID } from 'node:crypto';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import EmpresaDomainException from '@/modules/contratos/exceptions/empresa_domain.exception';
function isValidCnpj(cnpj: string) {
  const d = cnpj.replace(/\D/g, '');
  if (d.length !== 14 || /^([0-9])\1{13}$/.test(d)) return false;
  let t = d.length - 2,
    n = d.substring(0, t),
    y = d.substring(t),
    s = 0,
    m = t - 7;
  for (let i = t; i >= 1; i--) {
    s += Number(n.charAt(t - i)) * m--;
    if (m < 2) m = 9;
  }
  let r = s % 11;
  const d1 = r < 2 ? 0 : 11 - r;
  if (Number(y.charAt(0)) !== d1) return false;
  t += 1;
  n = d.substring(0, t);
  s = 0;
  m = t - 7;
  for (let i = t; i >= 1; i--) {
    s += Number(n.charAt(t - i)) * m--;
    if (m < 2) m = 9;
  }
  r = s % 11;
  const d2 = r < 2 ? 0 : 11 - r;
  return Number(y.charAt(1)) === d2;
}
export interface EmpresaContratadaProps {
  id: string;
  tenantId: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  cnpj: string;
  responsavel: string | null;
  cargoResponsavel: string | null;
  email: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  ativo: boolean;
  telefones: string[];
  createdAt: Date;
  updatedAt: Date;
}
export default class EmpresaContratadaEntity {
  private constructor(private readonly props: EmpresaContratadaProps) {}
  static create(p: {
    tenantId: string;
    razaoSocial: string;
    cnpj: string;
    nomeFantasia?: string | null;
    responsavel?: string | null;
    cargoResponsavel?: string | null;
    email?: string | null;
    cep?: string | null;
    logradouro?: string | null;
    numero?: string | null;
    complemento?: string | null;
    bairro?: string | null;
    cidade?: string | null;
    uf?: string | null;
    telefones?: string[];
  }): EmpresaContratadaEntity {
    const rs = p.razaoSocial?.trim();
    if (!rs)
      throw new EmpresaDomainException({
        code: ErrorCodeConstants.EMPRESA_INVALID_CNPJ,
      });
    const cnpj = p.cnpj?.replace(/\D/g, '');
    if (!cnpj || !isValidCnpj(cnpj))
      throw new EmpresaDomainException({
        code: ErrorCodeConstants.EMPRESA_INVALID_CNPJ,
      });
    const now = new Date();
    return new EmpresaContratadaEntity({
      id: randomUUID(),
      tenantId: p.tenantId,
      razaoSocial: rs,
      nomeFantasia: p.nomeFantasia?.trim() || null,
      cnpj,
      responsavel: p.responsavel?.trim() || null,
      cargoResponsavel: p.cargoResponsavel?.trim() || null,
      email: p.email?.trim() || null,
      cep: p.cep?.trim() || null,
      logradouro: p.logradouro?.trim() || null,
      numero: p.numero?.trim() || null,
      complemento: p.complemento?.trim() || null,
      bairro: p.bairro?.trim() || null,
      cidade: p.cidade?.trim() || null,
      uf: p.uf?.trim().toUpperCase() || null,
      ativo: true,
      telefones: p.telefones || [],
      createdAt: now,
      updatedAt: now,
    });
  }
  static fromData(p: EmpresaContratadaProps): EmpresaContratadaEntity {
    return new EmpresaContratadaEntity(p);
  }
  toObject(): EmpresaContratadaProps {
    return { ...this.props };
  }
  get id() {
    return this.props.id;
  }
  get tenantId() {
    return this.props.tenantId;
  }
  get razaoSocial() {
    return this.props.razaoSocial;
  }
  get cnpj() {
    return this.props.cnpj;
  }
  get ativo() {
    return this.props.ativo;
  }
  get telefones() {
    return this.props.telefones;
  }
}
