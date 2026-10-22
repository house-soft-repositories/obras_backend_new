import type UseCase from '@/core/types/use_case';
import type { Unit } from '@/core/types/unit';

export interface RemoveMedicaoParam {
  obraId: string;
  id: string;
}

type IRemoveMedicaoUseCase = UseCase<RemoveMedicaoParam, Unit>;
export default IRemoveMedicaoUseCase;
