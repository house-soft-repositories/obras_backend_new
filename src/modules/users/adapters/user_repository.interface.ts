import AppException from '@/core/exceptions/app_exception';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import AsyncResult from '@/core/types/async_result';
import UserEntity from '@/modules/users/domain/entities/user.entity';
import { UsuarioWithOrganizationalReadModel } from '@/modules/users/infra/read-models/usuario_with_organizational_read_model';

export interface SectorReference {
  id: string;
  orgaoId: string;
}

export interface FindUserQuery {
  email: string;
  tenantId: string | null;
}

export default interface IUserRepository {
  findOne(query: FindUserQuery): AsyncResult<AppException, UserEntity>;
  findById(id: string): AsyncResult<AppException, UserEntity>;
  listByTenantId(tenantId: string): AsyncResult<AppException, UserEntity[]>;
  listWithOrganizational(
    pageOptions: PageOptionsEntity,
    tenantId: string | null,
  ): AsyncResult<AppException, PageEntity<UsuarioWithOrganizationalReadModel>>;
  save(user: UserEntity): AsyncResult<AppException, UserEntity>;
  existsLocalidade(localidadeId: string, tenantId: string): AsyncResult<AppException, true>;
  existsOrgao(orgaoId: string, tenantId: string): AsyncResult<AppException, true>;
  findSetorById(
    setorId: string,
    tenantId: string,
  ): AsyncResult<AppException, SectorReference>;
}
