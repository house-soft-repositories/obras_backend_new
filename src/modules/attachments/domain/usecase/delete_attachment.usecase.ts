import type UseCase from '@/core/types/use_case';
import type { Unit } from '@/core/types/unit';

export type DeleteAttachmentParam = {
  id: string;
};

type IDeleteAttachmentUseCase = UseCase<DeleteAttachmentParam, Unit>;

export default IDeleteAttachmentUseCase;
