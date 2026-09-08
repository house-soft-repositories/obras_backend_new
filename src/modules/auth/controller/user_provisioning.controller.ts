import AppException from '@/core/exceptions/app_exception';
import PaginationOptionsDto from '@/core/pagination/dto/pagination_options.dto';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import RoleDecorator from '@/modules/auth/controller/role.decorator';
import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import type { AllowedRolePayload } from '@/modules/auth/controller/role.pipe';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import type ICreateUserUseCase from '@/modules/users/domain/usecase/create_user.usecase';
import type IListUsersUseCase from '@/modules/users/domain/usecase/list_users.usecase';
import CreateUserDto from '@/modules/users/dtos/create_user.dto';
import {
  CREATE_USER_SERVICE,
  LIST_USERS_SERVICE,
} from '@/modules/users/symbols';
import {
  Body,
  Controller,
  Get,
  HttpException,
  Inject,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

@Controller('api/users')
@UseGuards(AccessTokenGuard)
export default class UserProvisioningController {
  constructor(
    @Inject(CREATE_USER_SERVICE)
    private readonly createUser: ICreateUserUseCase,
    @Inject(LIST_USERS_SERVICE)
    private readonly listUsers: IListUsersUseCase,
    private readonly tenantRequestContext: TenantRequestContextService,
  ) {}

  @Get()
  async list(
    @Query() query: PaginationOptionsDto,
    @RoleDecorator(UserRole.ADMIN, UserRole.STAFF, UserRole.SUPERADMIN)
    user: AllowedRolePayload,
  ) {
    if (!user.tenantId) {
      const result = await this.listUsers.execute({
        requester: {
          id: user.sub,
          role: user.role,
          tenantId: null,
        },
        ...query,
      });
      if (result.isLeft()) {
        throw new HttpException(result.value.message, result.value.statusCode, {
          cause: result.value.cause,
        });
      }
      return result.value.toObject();
    }
    return this.withTenant(user, async () => {
      const result = await this.listUsers.execute({
        requester: {
          id: user.sub,
          role: user.role,
          tenantId: user.tenantId,
        },
        ...query,
      });
      if (result.isLeft()) {
        throw new HttpException(result.value.message, result.value.statusCode, {
          cause: result.value.cause,
        });
      }
      return result.value.toObject();
    });
  }

  @Post()
  async create(
    @Body() body: CreateUserDto,
    @RoleDecorator(UserRole.ADMIN, UserRole.STAFF, UserRole.SUPERADMIN)
    user: AllowedRolePayload,
  ) {
    const result = await this.createUser.execute({
      ...body,
      passwordHash: body.password,
      creator: {
        id: user.sub,
        role: user.role as
          UserRole.ADMIN | UserRole.STAFF | UserRole.SUPERADMIN,
        tenantId: user.tenantId,
      },
    });
    if (result.isLeft()) {
      throw new HttpException(result.value.message, result.value.statusCode, {
        cause: result.value.cause,
      });
    }
    return result.value.toResponse();
  }

  private async withTenant<T>(
    user: AllowedRolePayload | undefined,
    callback: () => Promise<T>,
  ): Promise<T> {
    try {
      return await this.tenantRequestContext.run(user, callback);
    } catch (error) {
      if (error instanceof AppException) this.throwHttp(error);
      throw error;
    }
  }

  private throwHttp(error: AppException): never {
    throw new HttpException(error.message, error.statusCode, {
      cause: error.cause,
    });
  }
}
