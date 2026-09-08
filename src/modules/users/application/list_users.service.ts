import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import IUserRepository from '@/modules/users/adapters/user_repository.interface';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import IListUsersUseCase, {
  ListUsersParam,
  ListUsersResponse,
} from '@/modules/users/domain/usecase/list_users.usecase';
import UserServiceException from '@/modules/users/exceptions/user_service.exception';

export default class ListUsersService implements IListUsersUseCase {
  constructor(private readonly repository: IUserRepository) {}

  async execute(
    param: ListUsersParam,
  ): AsyncResult<AppException, ListUsersResponse> {
    if (
      ![UserRole.ADMIN, UserRole.STAFF, UserRole.SUPERADMIN].includes(
        param.requester.role,
      ) ||
      !param.requester.tenantId
    ) {
      return left(
        new UserServiceException({
          code: ErrorCodeConstants.USER_CREATE_FORBIDDEN,
          statusCode: 403,
        }),
      );
    }

    const users = await this.repository.listByTenantId(
      param.requester.tenantId,
    );
    return users.map((items) => new ListUsersResponse(items));
  }
}
