import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';

type OrgaoRepositoryErrorCode =
  | typeof ErrorCodeConstants.ORGAO_NOT_FOUND
  | typeof ErrorCodeConstants.LOCALIDADE_NOT_FOUND
  | typeof ErrorCodeConstants.ORGAO_REPOSITORY_FAILED;

export default class OrgaoRepositoryException extends AppException {
  constructor({
    code,
    statusCode,
    cause,
  }: {
    code: OrgaoRepositoryErrorCode;
    statusCode: number;
    cause?: unknown;
  }) {
    super({ code, statusCode, cause });
  }
}
