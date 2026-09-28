import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';

export default class PastaRepositoryException extends AppException {
  constructor({
    code,
    statusCode,
    cause,
  }: {
    code:
      | typeof ErrorCodeConstants.PASTA_NOT_FOUND
      | typeof ErrorCodeConstants.PASTA_DUPLICATE_NAME
      | typeof ErrorCodeConstants.PASTA_REPOSITORY_FAILED;
    statusCode: number;
    cause?: unknown;
  }) {
    super({ code, statusCode, cause });
  }
}
