import UseCase from '@/core/types/use_case';
import type { Unit } from '@/core/types/unit';

export type DeleteFiscalizacaoParam = { id: string };

type IDeleteFiscalizacaoUseCase = UseCase<DeleteFiscalizacaoParam, Unit>;
export default IDeleteFiscalizacaoUseCase;
