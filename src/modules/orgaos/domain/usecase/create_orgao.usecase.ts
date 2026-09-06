import type UseCase from '@/core/types/use_case';
import OrgaoEntity, {
  CreateOrgaoProps,
} from '@/modules/orgaos/domain/entities/orgao.entity';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';

export type CreateOrgaoParam = CreateOrgaoProps & {
  role: UserRole;
};

type ICreateOrgaoUseCase = UseCase<CreateOrgaoParam, OrgaoEntity>;

export default ICreateOrgaoUseCase;
