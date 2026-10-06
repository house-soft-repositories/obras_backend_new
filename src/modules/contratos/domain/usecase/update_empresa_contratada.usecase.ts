import type UseCase from '@/core/types/use_case';
import EmpresaContratadaEntity, {
  EmpresaContratadaProps,
} from '@/modules/contratos/domain/entities/empresa_contratada.entity';

export interface UpdateEmpresaContratadaParam {
  id: string;
  patch: Partial<EmpresaContratadaProps>;
}

type IUpdateEmpresaContratadaUseCase = UseCase<
  UpdateEmpresaContratadaParam,
  EmpresaContratadaEntity
>;

export default IUpdateEmpresaContratadaUseCase;
