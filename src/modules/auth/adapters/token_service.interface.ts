import { UserRole } from '@/modules/users/domain/enums/user_role.enum';

export interface AccessTokenPayload {
  sub: string;
  type: 'access';
  role: UserRole;
  tenantId: string | null;
}

export interface RefreshTokenPayload {
  sub: string;
  sid: string;
  type: 'refresh';
}

export default interface ITokenService {
  signAccess(payload: Omit<AccessTokenPayload, 'type'>): Promise<string>;
  signRefresh(payload: Omit<RefreshTokenPayload, 'type'>): Promise<string>;
  verifyAccess(token: string): Promise<AccessTokenPayload>;
  verifyRefresh(token: string): Promise<RefreshTokenPayload>;
}
