import type UseCase from '@/core/types/use_case';
import type { Unit } from '@/core/types/unit';

export interface DuplicarArvoreParam {
  obraOrigemId: string;
  obraDestinoId: string;
}

type IDuplicarArvoreUseCase = UseCase<DuplicarArvoreParam, Unit>;
export default IDuplicarArvoreUseCase;
