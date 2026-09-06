import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import IPasswordHasher from '@/modules/auth/adapters/password_hasher.interface';
import IUserRepository from '@/modules/users/adapters/user_repository.interface';
import UserEntity from '@/modules/users/domain/entities/user.entity';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import ICreateUserUseCase, {
  CreateUserParam,
  CreateUserResponse,
} from '@/modules/users/domain/usecase/create_user.usecase';
import UserDomainException from '@/modules/users/exceptions/user_domain.exception';
import UserServiceException from '@/modules/users/exceptions/user_service.exception';

export default class CreateUserService implements ICreateUserUseCase {
  constructor(
    private readonly repository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(
    param: CreateUserParam,
  ): AsyncResult<AppException, CreateUserResponse> {
    try {
      const tenantId = this.resolveTargetTenantId(param);
      if (!tenantId) {
        return left(
          new UserServiceException({
            code: ErrorCodeConstants.USER_CREATE_FORBIDDEN,
            statusCode: 403,
          }),
        );
      }

      const existing = await this.repository.findOne({
        email: param.email,
        tenantId,
      });
      if (existing.isRight()) {
        return left(
          new UserServiceException({
            code: ErrorCodeConstants.USER_ALREADY_EXISTS,
            statusCode: 409,
          }),
        );
      }
      if (existing.value.code !== ErrorCodeConstants.USER_NOT_FOUND) {
        return left(existing.value);
      }

      const user = await this.createEntity(param, tenantId);
      const saved = await this.repository.save(user);
      return saved.map((entity) => new CreateUserResponse(entity));
    } catch (error) {
      if (error instanceof UserDomainException) return left(error);
      return left(
        new UserServiceException({
          code: ErrorCodeConstants.USER_CREATE_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }

  private resolveTargetTenantId(param: CreateUserParam): string | null {
    if (param.creator.role === UserRole.ADMIN) {
      if (param.tenantId && param.tenantId !== param.creator.tenantId)
        return null;
      return param.creator.tenantId;
    }
    return param.tenantId ?? null;
  }

  private async createEntity(
    param: CreateUserParam,
    tenantId: string,
  ): Promise<UserEntity> {
    const props = {
      name: param.name,
      email: param.email,
      password: await this.passwordHasher.hash(param.passwordHash),
    };
    return param.role === UserRole.STAFF
      ? UserEntity.createStaff(props, tenantId)
      : UserEntity.createUser(props, tenantId);
  }
}
