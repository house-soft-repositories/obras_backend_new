import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import type { AuthenticatedRequest } from '@/modules/auth/controller/access_token.guard';
import RolePipe from '@/modules/auth/controller/role.pipe';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';

const RoleDecorator = (...roles: UserRole[]) =>
  createParamDecorator(
    (_data: unknown, context: ExecutionContext): AccessTokenPayload | undefined =>
      new RolePipe(roles).transform(
        context.switchToHttp().getRequest<AuthenticatedRequest>().auth,
      ),
  )();

export default RoleDecorator;
