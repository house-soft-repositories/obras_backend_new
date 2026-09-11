import type UseCase from '@/core/types/use_case';
import ObraEntity from '@/modules/obras/domain/entities/obra.entity';

export interface GetObraParam {
  id: string;
}

type IGetObraUseCase = UseCase<GetObraParam, ObraEntity>;
export default IGetObraUseCase;
