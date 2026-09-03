import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import type { AuthenticatedRequest } from '@/modules/auth/controller/access_token.guard';

const AuthenticatedUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AccessTokenPayload | undefined =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().auth,
);

export default AuthenticatedUser;
