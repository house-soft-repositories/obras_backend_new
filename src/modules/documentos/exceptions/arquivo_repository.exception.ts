import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';

export default class ArquivoRepositoryException extends AppException {
  constructor({
    code,
    statusCode,
    cause,
  }: {
    code:
      | typeof ErrorCodeConstants.ARQUIVO_NOT_FOUND
      | typeof ErrorCodeConstants.ARQUIVO_REPOSITORY_FAILED;
    statusCode: number;
    cause?: unknown;
  }) {
    super({ code, statusCode, cause });
  }
}
