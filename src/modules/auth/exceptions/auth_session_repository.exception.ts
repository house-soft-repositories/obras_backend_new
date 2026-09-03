import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';

type AuthSessionRepositoryErrorCode =
  | typeof ErrorCodeConstants.AUTH_SESSION_NOT_FOUND
  | typeof ErrorCodeConstants.AUTH_SESSION_REPOSITORY_FAILED;

export default class AuthSessionRepositoryException extends AppException {
  constructor({
    code,
    statusCode,
    cause,
  }: {
    code: AuthSessionRepositoryErrorCode;
    statusCode: number;
    cause?: unknown;
  }) {
    super({ code, statusCode, cause });
  }
}
