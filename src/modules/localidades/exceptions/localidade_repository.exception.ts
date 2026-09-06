import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';

type LocalidadeRepositoryErrorCode =
  | typeof ErrorCodeConstants.LOCALIDADE_NOT_FOUND
  | typeof ErrorCodeConstants.LOCALIDADE_REPOSITORY_FAILED;

export default class LocalidadeRepositoryException extends AppException {
  constructor({ code, statusCode, cause }: { code: LocalidadeRepositoryErrorCode; statusCode: number; cause?: unknown }) {
    super({ code, statusCode, cause });
  }
}
