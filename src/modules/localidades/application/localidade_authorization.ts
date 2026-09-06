import ErrorCodeConstants from '@/core/constants/error_code.constants';
import LocalidadeServiceException from '@/modules/localidades/exceptions/localidade_service.exception';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';

export function denyUnlessWriter(role: UserRole) {
  if (role === UserRole.ADMIN) return null;
  return new LocalidadeServiceException({
    code: ErrorCodeConstants.LOCALIDADE_ACCESS_FORBIDDEN,
    statusCode: 403,
  });
}

export function denyUnlessReader(role: UserRole) {
  if ([UserRole.ADMIN, UserRole.STAFF, UserRole.USER].includes(role)) return null;
  return new LocalidadeServiceException({
    code: ErrorCodeConstants.LOCALIDADE_ACCESS_FORBIDDEN,
    statusCode: 403,
  });
}
