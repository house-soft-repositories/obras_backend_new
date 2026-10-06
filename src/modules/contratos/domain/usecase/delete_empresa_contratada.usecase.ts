import type UseCase from '@/core/types/use_case';

export interface DeleteEmpresaContratadaParam {
  id: string;
}

type IDeleteEmpresaContratadaUseCase = UseCase<
  DeleteEmpresaContratadaParam,
  void
>;

export default IDeleteEmpresaContratadaUseCase;
