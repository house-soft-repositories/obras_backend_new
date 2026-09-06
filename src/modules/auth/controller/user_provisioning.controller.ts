import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import RoleDecorator from '@/modules/auth/controller/role.decorator';
import type { AllowedRolePayload } from '@/modules/auth/controller/role.pipe';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import type ICreateUserUseCase from '@/modules/users/domain/usecase/create_user.usecase';
import CreateUserDto from '@/modules/users/dtos/create_user.dto';
import { CREATE_USER_SERVICE } from '@/modules/users/symbols';
import {
  Body,
  Controller,
  HttpException,
  Inject,
  Post,
  UseGuards,
} from '@nestjs/common';

@Controller('api/users')
@UseGuards(AccessTokenGuard)
export default class UserProvisioningController {
  constructor(
    @Inject(CREATE_USER_SERVICE)
    private readonly createUser: ICreateUserUseCase,
  ) {}

  @Post()
  async create(
    @Body() body: CreateUserDto,
    @RoleDecorator(UserRole.ADMIN, UserRole.SUPERADMIN)
    user: AllowedRolePayload,
  ) {
    const result = await this.createUser.execute({
      ...body,
      passwordHash: body.password,
      creator: {
        id: user.sub,
        role: user.role,
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
}
