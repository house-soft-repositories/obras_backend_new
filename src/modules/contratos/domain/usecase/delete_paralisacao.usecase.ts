import type UseCase from '@/core/types/use_case';

export interface DeleteParalisacaoParam {
  id: string;
}

type IDeleteParalisacaoUseCase = UseCase<DeleteParalisacaoParam, void>;

export default IDeleteParalisacaoUseCase;
