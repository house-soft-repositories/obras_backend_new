import type UseCase from '@/core/types/use_case';
import FonteEntity, { CreateFonteProps } from '@/modules/fontes/domain/entities/fonte.entity';

export type UpdateFonteParam = Partial<CreateFonteProps> & {
  id: string;
};

type IUpdateFonteUseCase = UseCase<UpdateFonteParam, FonteEntity>;
export default IUpdateFonteUseCase;
