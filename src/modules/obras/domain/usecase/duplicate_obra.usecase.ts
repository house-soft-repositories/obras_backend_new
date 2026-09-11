import type UseCase from '@/core/types/use_case';
import ObraEntity from '@/modules/obras/domain/entities/obra.entity';

export interface DuplicateObraParam {
  id: string;
}

type IDuplicateObraUseCase = UseCase<DuplicateObraParam, ObraEntity>;
export default IDuplicateObraUseCase;
