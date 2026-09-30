import type UseCase from '@/core/types/use_case';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';

export interface DeleteLocalidadeParam {
  id: string;
  role: UserRole;
}

type IDeleteLocalidadeUseCase = UseCase<DeleteLocalidadeParam, void>;

export default IDeleteLocalidadeUseCase;
