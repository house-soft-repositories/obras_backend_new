import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';

type UserServiceErrorCode =
  | typeof ErrorCodeConstants.USER_ALREADY_EXISTS
  | typeof ErrorCodeConstants.USER_CREATE_FORBIDDEN
  | typeof ErrorCodeConstants.USER_CREATE_FAILED
  | typeof ErrorCodeConstants.USER_INVALID_ORGANIZATIONAL_LINK
  | typeof ErrorCodeConstants.USER_INVALID_TENANT;

export default class UserServiceException extends AppException {
  constructor({
    code,
    statusCode,
    message,
    cause,
  }: {
    code: UserServiceErrorCode;
    statusCode: number;
    message?: string;
    cause?: unknown;
  }) {
    super({ code, statusCode, message, cause });
  }
}
