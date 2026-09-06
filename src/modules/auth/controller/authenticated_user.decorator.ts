import {
  createParamDecorator,
  ExecutionContext,
  PipeTransform,
} from '@nestjs/common';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import type { AuthenticatedRequest } from '@/modules/auth/controller/access_token.guard';

const authenticatedUserFactory = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AccessTokenPayload | undefined =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().auth,
);

type PipeLike = PipeTransform | (new (...args: never[]) => PipeTransform);

const AuthenticatedUser = (...pipes: PipeLike[]) =>
  authenticatedUserFactory(undefined, ...(pipes as never[]));

export default AuthenticatedUser;
