import AppException from '@/core/exceptions/app_exception';
import ErrorCodeConstants from '@/core/constants/error_code.constants';

type UserRepositoryErrorCode =
  | typeof ErrorCodeConstants.USER_NOT_FOUND
  | typeof ErrorCodeConstants.USER_REPOSITORY_FAILED
  | typeof ErrorCodeConstants.LOCALIDADE_NOT_FOUND
  | typeof ErrorCodeConstants.ORGAO_NOT_FOUND
  | typeof ErrorCodeConstants.SETOR_NOT_FOUND;

export default class UserRepositoryException extends AppException {
  constructor({
    code,
    statusCode,
    message,
    cause,
  }: {
    code: UserRepositoryErrorCode;
    statusCode: number;
    message?: string;
    cause?: unknown;
  }) {
    super({ code, statusCode, message, cause });
  }
}
