import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';

type TenancyRepositoryErrorCode =
  | typeof ErrorCodeConstants.TENANCY_INVALID_SCHEMA
  | typeof ErrorCodeConstants.TENANCY_PROVISION_FAILED;

export default class TenancyRepositoryException extends AppException {
  constructor({
    code,
    statusCode,
    message,
    cause,
  }: {
    code: TenancyRepositoryErrorCode;
    statusCode: number;
    message?: string;
    cause?: unknown;
  }) {
    super({ code, statusCode, message, cause });
  }
}
