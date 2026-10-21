import type UseCase from '@/core/types/use_case';
import type { Unit } from '@/core/types/unit';

export interface RemoveEstagioParam {
  obraId: string;
  id: string;
}

type IRemoveEstagioUseCase = UseCase<RemoveEstagioParam, Unit>;
export default IRemoveEstagioUseCase;
