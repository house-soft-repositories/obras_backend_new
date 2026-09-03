import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';

type AuthServiceErrorCode =
  | typeof ErrorCodeConstants.AUTH_INVALID_CREDENTIALS
  | typeof ErrorCodeConstants.AUTH_LOGIN_FAILED
  | typeof ErrorCodeConstants.AUTH_INVALID_REFRESH_TOKEN
  | typeof ErrorCodeConstants.AUTH_REFRESH_FAILED;

export default class AuthServiceException extends AppException {
  constructor({ code, statusCode, cause }: { code: AuthServiceErrorCode; statusCode: number; cause?: unknown }) {
    super({ code, statusCode, cause });
  }
}
