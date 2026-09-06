import type UseCase from '@/core/types/use_case';
import SetorEntity, {
  CreateSetorProps,
} from '@/modules/orgaos/domain/entities/setor.entity';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';

export type CreateSetorParam = CreateSetorProps & {
  role: UserRole;
};

type ICreateSetorUseCase = UseCase<CreateSetorParam, SetorEntity>;

export default ICreateSetorUseCase;
