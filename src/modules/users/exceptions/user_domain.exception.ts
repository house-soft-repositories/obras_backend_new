import AppException from '@/core/exceptions/app_exception';
import ErrorCodeConstants from '@/core/constants/error_code.constants';

type UserDomainErrorCode =
  | typeof ErrorCodeConstants.USER_INVALID_NAME
  | typeof ErrorCodeConstants.USER_INVALID_EMAIL
  | typeof ErrorCodeConstants.USER_INVALID_PASSWORD
  | typeof ErrorCodeConstants.USER_INVALID_TENANT;

export default class UserDomainException extends AppException {
  constructor({ code, message }: { code: UserDomainErrorCode; message?: string }) {
    super({ code, statusCode: 400, message });
  }
}
