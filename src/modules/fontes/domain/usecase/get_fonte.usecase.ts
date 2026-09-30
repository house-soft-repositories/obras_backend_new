import type UseCase from '@/core/types/use_case';
import FonteEntity from '@/modules/fontes/domain/entities/fonte.entity';

export interface GetFonteParam {
  id: string;
}

type IGetFonteUseCase = UseCase<GetFonteParam, FonteEntity>;
export default IGetFonteUseCase;
