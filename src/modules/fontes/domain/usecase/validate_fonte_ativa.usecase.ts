import type UseCase from '@/core/types/use_case';
import FonteEntity from '@/modules/fontes/domain/entities/fonte.entity';

export interface ValidateFonteAtivaParam {
  id: string;
}

type IValidateFonteAtivaUseCase = UseCase<ValidateFonteAtivaParam, FonteEntity>;
export default IValidateFonteAtivaUseCase;
