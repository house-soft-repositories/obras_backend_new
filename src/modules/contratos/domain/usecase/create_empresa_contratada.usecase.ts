import type UseCase from '@/core/types/use_case';
import EmpresaContratadaEntity from '@/modules/contratos/domain/entities/empresa_contratada.entity';

export interface CreateEmpresaContratadaParam {
  razaoSocial: string;
  cnpj: string;
  nomeFantasia?: string | null;
  responsavel?: string | null;
  email?: string | null;
  cargoResponsavel?: string | null;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  telefones?: string[];
}

type ICreateEmpresaContratadaUseCase = UseCase<
  CreateEmpresaContratadaParam,
  EmpresaContratadaEntity
>;

export default ICreateEmpresaContratadaUseCase;
