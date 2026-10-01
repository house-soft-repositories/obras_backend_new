import UseCase from '@/core/types/use_case';
import type { Unit } from '@/core/types/unit';
export type DeleteHabiteSeParam = { id: string };
type IDeleteHabiteSeUseCase = UseCase<DeleteHabiteSeParam, Unit>;
export default IDeleteHabiteSeUseCase;
