import UseCase from '@/core/types/use_case';
import type { Unit } from '@/core/types/unit';

export type DeleteAlvaraParam = { id: string };

type IDeleteAlvaraUseCase = UseCase<DeleteAlvaraParam, Unit>;
export default IDeleteAlvaraUseCase;
