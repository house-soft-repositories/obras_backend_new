import type UseCase from '@/core/types/use_case';
import type { Unit } from '@/core/types/unit';

export interface DeleteAditivoParam {
  id: string;
}

type IDeleteAditivoUseCase = UseCase<DeleteAditivoParam, Unit>;

export default IDeleteAditivoUseCase;
