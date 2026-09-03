import type ITokenService from '@/modules/auth/adapters/token_service.interface';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import { TOKEN_SERVICE } from '@/modules/auth/symbols';
import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Inject,
  Injectable,
} from '@nestjs/common';

export interface AuthenticatedRequest {
  headers: { authorization?: string };
  auth?: AccessTokenPayload;
}

@Injectable()
export default class AccessTokenGuard implements CanActivate {
  constructor(@Inject(TOKEN_SERVICE) private readonly tokens: ITokenService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new HttpException('Unauthorized', 401);
    try {
      request.auth = await this.tokens.verifyAccess(token);
      return true;
    } catch (cause) {
      throw new HttpException('Unauthorized', 401, { cause });
    }
  }
}
