import type UseCase from '@/core/types/use_case';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';

export interface DeleteSetorParam {
  id: string;
  role: UserRole;
}

type IDeleteSetorUseCase = UseCase<DeleteSetorParam, void>;

export default IDeleteSetorUseCase;
