import type UseCase from '@/core/types/use_case';
import type { Unit } from '@/core/types/unit';

export interface ReorderEstagiosParam {
  obraId: string;
  itens: { id: string; posicao: number }[];
}

type IReorderEstagiosUseCase = UseCase<ReorderEstagiosParam, Unit>;
export default IReorderEstagiosUseCase;
