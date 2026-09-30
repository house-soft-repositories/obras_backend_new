import type UseCase from '@/core/types/use_case';

export interface DeletePessoaParam {
  id: string;
}

type IDeletePessoaUseCase = UseCase<DeletePessoaParam, void>;
export default IDeletePessoaUseCase;
