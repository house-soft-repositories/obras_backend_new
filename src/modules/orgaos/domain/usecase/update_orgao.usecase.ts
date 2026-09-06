import type UseCase from '@/core/types/use_case';
import OrgaoEntity, {
  UpdateOrgaoProps,
} from '@/modules/orgaos/domain/entities/orgao.entity';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';

export type UpdateOrgaoParam = UpdateOrgaoProps & {
  id: string;
  role: UserRole;
};

type IUpdateOrgaoUseCase = UseCase<UpdateOrgaoParam, OrgaoEntity>;

export default IUpdateOrgaoUseCase;
