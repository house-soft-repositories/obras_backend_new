import PageEntity from '@/core/pagination/domain/entities/page.entity';
import type UseCase from '@/core/types/use_case';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import { UsuarioWithOrganizationalReadModel } from '@/modules/users/infra/read-models/usuario_with_organizational_read_model';

export interface ListUsersParam {
  requester: {
    id: string;
    role: UserRole;
    tenantId: string | null;
  };
  order?: 'ASC' | 'DESC';
  page?: number;
  take?: number;
}

type IListUsersUseCase = UseCase<ListUsersParam, PageEntity<UsuarioWithOrganizationalReadModel>>;

export default IListUsersUseCase;
