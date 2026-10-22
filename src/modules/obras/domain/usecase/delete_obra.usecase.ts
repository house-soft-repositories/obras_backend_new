import type UseCase from '@/core/types/use_case';
import type { Unit } from '@/core/types/unit';

export interface DeleteObraParam {
  id: string;
}

type IDeleteObraUseCase = UseCase<DeleteObraParam, Unit>;
export default IDeleteObraUseCase;
