import type UseCase from '@/core/types/use_case';
import SetorEntity, {
  UpdateSetorProps,
} from '@/modules/orgaos/domain/entities/setor.entity';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';

export type UpdateSetorParam = UpdateSetorProps & {
  id: string;
  role: UserRole;
};

type IUpdateSetorUseCase = UseCase<UpdateSetorParam, SetorEntity>;

export default IUpdateSetorUseCase;
