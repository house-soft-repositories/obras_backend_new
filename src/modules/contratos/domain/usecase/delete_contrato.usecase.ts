import type UseCase from '@/core/types/use_case';

export interface DeleteContratoParam {
  id: string;
}

type IDeleteContratoUseCase = UseCase<DeleteContratoParam, void>;

export default IDeleteContratoUseCase;
