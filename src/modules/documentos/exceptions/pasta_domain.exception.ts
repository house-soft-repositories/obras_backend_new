import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';

export default class PastaDomainException extends AppException {
  constructor({
    code,
  }: {
    code:
      | typeof ErrorCodeConstants.PASTA_INVALID_NAME
      | typeof ErrorCodeConstants.PASTA_DUPLICATE_NAME;
  }) {
    super({ code, statusCode: 400 });
  }
}
