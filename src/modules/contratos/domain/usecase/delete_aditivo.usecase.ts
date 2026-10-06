import type UseCase from '@/core/types/use_case';

export interface DeleteAditivoParam {
  id: string;
}

type IDeleteAditivoUseCase = UseCase<DeleteAditivoParam, void>;

export default IDeleteAditivoUseCase;
