import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import OrgaoServiceException from '@/modules/orgaos/exceptions/orgao_service.exception';
import SetorServiceException from '@/modules/orgaos/exceptions/setor_service.exception';

export function denyUnlessOrgaoWriter(
  role: UserRole,
): OrgaoServiceException | null {
  if (role === UserRole.ADMIN) return null;
  return new OrgaoServiceException({
    code: ErrorCodeConstants.ORGAO_ACCESS_FORBIDDEN,
    statusCode: 403,
  });
}

export function denyUnlessSetorWriter(
  role: UserRole,
): SetorServiceException | null {
  if (role === UserRole.ADMIN || role === UserRole.STAFF) return null;
  return new SetorServiceException({
    code: ErrorCodeConstants.SETOR_ACCESS_FORBIDDEN,
    statusCode: 403,
  });
}

export function denyUnlessOrgaoReader(
  role: UserRole,
): OrgaoServiceException | null {
  if ([UserRole.ADMIN, UserRole.STAFF, UserRole.USER].includes(role)) {
    return null;
  }
  return new OrgaoServiceException({
    code: ErrorCodeConstants.ORGAO_ACCESS_FORBIDDEN,
    statusCode: 403,
  });
}

export function denyUnlessSetorReader(
  role: UserRole,
): SetorServiceException | null {
  if ([UserRole.ADMIN, UserRole.STAFF, UserRole.USER].includes(role)) {
    return null;
  }
  return new SetorServiceException({
    code: ErrorCodeConstants.SETOR_ACCESS_FORBIDDEN,
    statusCode: 403,
  });
}
