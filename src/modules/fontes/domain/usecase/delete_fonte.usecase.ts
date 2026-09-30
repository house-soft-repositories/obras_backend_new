import type UseCase from '@/core/types/use_case';

export interface DeleteFonteParam {
  id: string;
}

type IDeleteFonteUseCase = UseCase<DeleteFonteParam, void>;
export default IDeleteFonteUseCase;
