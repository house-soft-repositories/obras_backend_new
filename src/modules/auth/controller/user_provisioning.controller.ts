import {
  Body,
  Controller,
  HttpException,
  Inject,
  Post,
  UseGuards,
} from '@nestjs/common';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import AuthenticatedUser from '@/modules/auth/controller/authenticated_user.decorator';
import type ICreateUserUseCase from '@/modules/users/domain/usecase/create_user.usecase';
import CreateUserDto from '@/modules/users/dtos/create_user.dto';
import { CREATE_USER_SERVICE } from '@/modules/users/symbols';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';

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
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    if (!user) throw new HttpException('Unauthorized', 401);
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPERADMIN) {
      throw new HttpException('Forbidden', 403);
    }
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
    return result.value;
  }
}
