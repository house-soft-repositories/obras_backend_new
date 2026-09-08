import PageEntity from '@/core/pagination/domain/entities/page.entity';
import type UseCase from '@/core/types/use_case';
import OrgaoEntity from '@/modules/orgaos/domain/entities/orgao.entity';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';

export interface ListOrgaosParam {
  order?: 'ASC' | 'DESC';
  page?: number;
  role: UserRole;
  take?: number;
}

type IListOrgaosUseCase = UseCase<ListOrgaosParam, PageEntity<OrgaoEntity>>;

export default IListOrgaosUseCase;
