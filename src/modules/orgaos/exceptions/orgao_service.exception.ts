import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';

type OrgaoServiceErrorCode =
  | typeof ErrorCodeConstants.ORGAO_ACCESS_FORBIDDEN
  | typeof ErrorCodeConstants.ORGAO_CREATE_FAILED
  | typeof ErrorCodeConstants.ORGAO_UPDATE_FAILED;

export default class OrgaoServiceException extends AppException {
  constructor({
    code,
    statusCode,
    cause,
  }: {
    code: OrgaoServiceErrorCode;
    statusCode: number;
    cause?: unknown;
  }) {
    super({ code, statusCode, cause });
  }
}
