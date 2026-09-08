import PageEntity from '@/core/pagination/domain/entities/page.entity';
import type UseCase from '@/core/types/use_case';
import { SetorWithOrgaoReadModel } from '@/modules/orgaos/infra/read-models/setor_with_orgao_read_model';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';

export interface ListSetoresParam {
  order?: 'ASC' | 'DESC';
  page?: number;
  role: UserRole;
  take?: number;
}

type IListSetoresUseCase = UseCase<
  ListSetoresParam,
  PageEntity<SetorWithOrgaoReadModel>
>;

export default IListSetoresUseCase;
