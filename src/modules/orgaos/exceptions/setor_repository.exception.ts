import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';

type SetorRepositoryErrorCode =
  | typeof ErrorCodeConstants.SETOR_NOT_FOUND
  | typeof ErrorCodeConstants.ORGAO_NOT_FOUND
  | typeof ErrorCodeConstants.SETOR_REPOSITORY_FAILED;

export default class SetorRepositoryException extends AppException {
  constructor({
    code,
    statusCode,
    cause,
  }: {
    code: SetorRepositoryErrorCode;
    statusCode: number;
    cause?: unknown;
  }) {
    super({ code, statusCode, cause });
  }
}
