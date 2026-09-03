import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import type IUserRepository from '@/modules/users/adapters/user_repository.interface';
import UserRequestContext from '@/modules/users/dtos/user_request_context.dto';
import { USER_REPOSITORY } from '@/modules/users/symbols';
import {
  HttpException,
  Inject,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export default class UserRequestContextPipe implements PipeTransform {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
  ) {}

  async transform(
    payload: AccessTokenPayload | undefined,
  ): Promise<UserRequestContext> {
    if (!payload) throw new HttpException('Unauthorized', 401);
    const result = await this.users.findById(payload.sub);
    if (result.isLeft()) throw new HttpException('Unauthorized', 401);
    return {
      id: result.value.id,
      name: result.value.name,
      email: result.value.email,
      role: result.value.role,
      tenantId: result.value.tenantId,
      createdAt: result.value.createdAt.toISOString(),
      updatedAt: result.value.updatedAt.toISOString(),
    };
  }
}
