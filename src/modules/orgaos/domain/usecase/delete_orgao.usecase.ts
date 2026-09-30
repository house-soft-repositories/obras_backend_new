import type UseCase from '@/core/types/use_case';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';

export interface DeleteOrgaoParam {
  id: string;
  role: UserRole;
}

type IDeleteOrgaoUseCase = UseCase<DeleteOrgaoParam, void>;

export default IDeleteOrgaoUseCase;
