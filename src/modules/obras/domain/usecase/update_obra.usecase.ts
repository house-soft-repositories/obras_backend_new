import type UseCase from '@/core/types/use_case';
import ObraEntity from '@/modules/obras/domain/entities/obra.entity';
import { UpdateObraProps } from '@/modules/obras/domain/entities/obra.entity';

export interface UpdateObraParam {
  id: string;
  data: UpdateObraProps;
}

type IUpdateObraUseCase = UseCase<UpdateObraParam, ObraEntity>;
export default IUpdateObraUseCase;
