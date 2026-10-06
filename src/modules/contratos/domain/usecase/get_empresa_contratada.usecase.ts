import type UseCase from '@/core/types/use_case';
import EmpresaContratadaEntity from '@/modules/contratos/domain/entities/empresa_contratada.entity';

export interface GetEmpresaContratadaParam {
  id: string;
}

type IGetEmpresaContratadaUseCase = UseCase<
  GetEmpresaContratadaParam,
  EmpresaContratadaEntity
>;

export default IGetEmpresaContratadaUseCase;
