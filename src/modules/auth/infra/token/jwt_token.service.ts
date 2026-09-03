import { JwtService } from '@nestjs/jwt';
import ConfigurationService from '@/core/services/configuration.service';
import ITokenService, {
  AccessTokenPayload,
  RefreshTokenPayload,
} from '@/modules/auth/adapters/token_service.interface';
import AuthTokenException from '@/modules/auth/exceptions/auth_token.exception';

export default class JwtTokenService implements ITokenService {
  private readonly jwtService: JwtService;

  constructor(configurationService: ConfigurationService) {
    this.jwtService = new JwtService({ secret: configurationService.get('JWT_SECRET') });
  }

  signAccess(payload: Omit<AccessTokenPayload, 'type'>): Promise<string> {
    return this.jwtService.signAsync({ ...payload, type: 'access' }, { expiresIn: '1h' });
  }

  signRefresh(payload: Omit<RefreshTokenPayload, 'type'>): Promise<string> {
    return this.jwtService.signAsync({ ...payload, type: 'refresh' }, { expiresIn: '7d' });
  }

  async verifyAccess(token: string): Promise<AccessTokenPayload> {
    const payload = await this.verify(token);
    if (payload.type !== 'access' || !this.isAccessPayload(payload)) {
      throw new AuthTokenException({});
    }
    return payload;
  }

  async verifyRefresh(token: string): Promise<RefreshTokenPayload> {
    const payload = await this.verify(token);
    if (payload.type !== 'refresh' || !this.isRefreshPayload(payload)) {
      throw new AuthTokenException({});
    }
    return payload;
  }

  private async verify(token: string): Promise<Record<string, unknown>> {
    try {
      return await this.jwtService.verifyAsync<Record<string, unknown>>(token);
    } catch (error) {
      throw new AuthTokenException({ cause: error });
    }
  }

  private isAccessPayload(
    payload: Record<string, unknown>,
  ): payload is Record<string, unknown> & AccessTokenPayload {
    return (
      typeof payload.sub === 'string' &&
      typeof payload.role === 'string' &&
      (typeof payload.tenantId === 'string' || payload.tenantId === null)
    );
  }

  private isRefreshPayload(
    payload: Record<string, unknown>,
  ): payload is Record<string, unknown> & RefreshTokenPayload {
    return typeof payload.sub === 'string' && typeof payload.sid === 'string';
  }
}
