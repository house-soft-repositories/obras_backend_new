import type UseCase from '@/core/types/use_case';
import OrgaoEntity from '@/modules/orgaos/domain/entities/orgao.entity';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';

export interface ListOrgaosParam {
  role: UserRole;
}

type IListOrgaosUseCase = UseCase<ListOrgaosParam, OrgaoEntity[]>;

export default IListOrgaosUseCase;
