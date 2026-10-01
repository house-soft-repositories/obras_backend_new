import UseCase from '@/core/types/use_case';
import type { Unit } from '@/core/types/unit';

export type ExcluirObraParam = { id: string };

type IExcluirObraUseCase = UseCase<ExcluirObraParam, Unit>;
export default IExcluirObraUseCase;
