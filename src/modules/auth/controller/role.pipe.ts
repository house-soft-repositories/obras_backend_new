import { HttpException, Injectable, PipeTransform } from '@nestjs/common';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';

export type AllowedRolePayload = Omit<AccessTokenPayload, 'role'> & {
  role: UserRole.ADMIN | UserRole.SUPERADMIN;
};

@Injectable()
export default class RolePipe
  implements PipeTransform<AccessTokenPayload | undefined, AllowedRolePayload>
{
  constructor(private readonly allowedRoles: UserRole[]) {}

  transform(payload: AccessTokenPayload | undefined): AllowedRolePayload {
    if (!payload || !this.allowedRoles.includes(payload.role)) {
      throw new HttpException('Unauthorized', 401);
    }
    return payload as AllowedRolePayload;
  }
}
