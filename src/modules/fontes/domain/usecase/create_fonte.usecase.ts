import type UseCase from '@/core/types/use_case';
import FonteEntity, { CreateFonteProps } from '@/modules/fontes/domain/entities/fonte.entity';
export type CreateFonteParam = CreateFonteProps;
type ICreateFonteUseCase = UseCase<CreateFonteParam, FonteEntity>;
export default ICreateFonteUseCase;
