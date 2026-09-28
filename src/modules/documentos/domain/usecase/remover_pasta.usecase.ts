import type UseCase from '@/core/types/use_case';
import type { Unit } from '@/core/types/unit';

export interface RemoverPastaParam {
  pastaId: string;
}

type IRemoverPastaUseCase = UseCase<RemoverPastaParam, Unit>;
export default IRemoverPastaUseCase;
