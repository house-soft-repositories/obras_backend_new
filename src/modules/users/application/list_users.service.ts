import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import IUserRepository from '@/modules/users/adapters/user_repository.interface';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import IListUsersUseCase, {
  ListUsersParam,
} from '@/modules/users/domain/usecase/list_users.usecase';
import { UsuarioWithOrganizationalReadModel } from '@/modules/users/infra/read-models/usuario_with_organizational_read_model';
import UserServiceException from '@/modules/users/exceptions/user_service.exception';

export default class ListUsersService implements IListUsersUseCase {
  constructor(private readonly repository: IUserRepository) {}

  async execute(
    param: ListUsersParam,
  ): AsyncResult<AppException, PageEntity<UsuarioWithOrganizationalReadModel>> {
    if (
      ![UserRole.ADMIN, UserRole.STAFF, UserRole.SUPERADMIN].includes(
        param.requester.role,
      )
    ) {
      return left(
        new UserServiceException({
          code: ErrorCodeConstants.USER_CREATE_FORBIDDEN,
          statusCode: 403,
        }),
      );
    }

    if (
      !param.requester.tenantId &&
      param.requester.role !== UserRole.SUPERADMIN
    ) {
      return left(
        new UserServiceException({
          code: ErrorCodeConstants.USER_CREATE_FORBIDDEN,
          statusCode: 403,
        }),
      );
    }

    const pageOptions = new PageOptionsEntity(
      param.order,
      param.page,
      param.take,
    );
    return this.repository.listWithOrganizational(
      pageOptions,
      param.requester.tenantId,
    );
  }
}
