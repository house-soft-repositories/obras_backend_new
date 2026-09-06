import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
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
      if (!this.canCreateRole(param)) {
        return left(
          new UserServiceException({
            code: ErrorCodeConstants.USER_CREATE_FORBIDDEN,
            statusCode: 403,
          }),
        );
      }
      const tenantId = this.resolveTargetTenantId(param);
      if (tenantId === null && param.role !== UserRole.SUPERADMIN) {
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

      const references = await this.resolveReferences(param, tenantId);
      if (references.isLeft()) return left(references.value);

      const user = await this.createEntity(param, tenantId);
      const saved = await this.repository.save(
        user.update({
          localidadeId: references.value.localidadeId,
          orgaoId: references.value.orgaoId,
          setorId: references.value.setorId,
        }),
      );
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

  private resolveTargetTenantId(
    param: CreateUserParam,
  ): string | null {
    if (param.creator.role === UserRole.ADMIN) {
      if (!param.creator.tenantId) return null;
      if (param.role === UserRole.SUPERADMIN) return null;
      if (param.tenantId && param.tenantId !== param.creator.tenantId)
        return null;
      return param.creator.tenantId;
    }
    if (param.role === UserRole.SUPERADMIN) return null;
    return param.tenantId ?? null;
  }

  private canCreateRole(param: CreateUserParam): boolean {
    if (param.creator.role === UserRole.SUPERADMIN) return true;
    return param.role !== UserRole.SUPERADMIN;
  }

  private async createEntity(
    param: CreateUserParam,
    tenantId: string | null,
  ): Promise<UserEntity> {
    const props = {
      name: param.name,
      email: param.email,
      password: await this.passwordHasher.hash(param.passwordHash),
    };
    if (param.role === UserRole.SUPERADMIN) return UserEntity.createSuperAdmin(props);
    if (!tenantId) {
      throw new UserDomainException({
        code: ErrorCodeConstants.USER_INVALID_TENANT,
      });
    }
    if (param.role === UserRole.ADMIN) return UserEntity.createAdmin(props, tenantId);
    if (param.role === UserRole.STAFF) return UserEntity.createStaff(props, tenantId);
    return UserEntity.createUser(props, tenantId);
  }

  private async resolveReferences(
    param: CreateUserParam,
    tenantId: string | null,
  ): AsyncResult<
    AppException,
    {
      localidadeId: string | null;
      orgaoId: string | null;
      setorId: string | null;
    }
  > {
    if (!tenantId) {
      return right({ localidadeId: null, orgaoId: null, setorId: null });
    }

    if (param.localidadeId) {
      const localidade = await this.repository.existsLocalidade(
        param.localidadeId,
        tenantId,
      );
      if (localidade.isLeft()) return left(localidade.value);
    }

    let orgaoId = param.orgaoId ?? null;
    if (orgaoId) {
      const orgao = await this.repository.existsOrgao(orgaoId, tenantId);
      if (orgao.isLeft()) return left(orgao.value);
    }

    if (param.setorId) {
      const setor = await this.repository.findSetorById(param.setorId, tenantId);
      if (setor.isLeft()) return left(setor.value);
      if (orgaoId && setor.value.orgaoId !== orgaoId) {
        return left(
          new UserServiceException({
            code: ErrorCodeConstants.USER_INVALID_ORGANIZATIONAL_LINK,
            statusCode: 400,
          }),
        );
      }
      orgaoId = orgaoId ?? setor.value.orgaoId;
    }

    return right({
      localidadeId: param.localidadeId ?? null,
      orgaoId,
      setorId: param.setorId ?? null,
    });
  }
}
