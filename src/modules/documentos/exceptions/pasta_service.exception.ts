import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';

export default class PastaServiceException extends AppException {
  constructor({
    code,
    statusCode,
    cause,
  }: {
    code:
      | typeof ErrorCodeConstants.PASTA_CREATE_FAILED
      | typeof ErrorCodeConstants.PASTA_DUPLICATE_NAME
      | typeof ErrorCodeConstants.PASTA_DELETE_FAILED
      | typeof ErrorCodeConstants.PASTA_DELETE_FORBIDDEN;
    statusCode: number;
    cause?: unknown;
  }) {
    super({ code, statusCode, cause });
  }
}
