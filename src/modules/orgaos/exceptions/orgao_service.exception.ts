import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';

type OrgaoServiceErrorCode =
  | typeof ErrorCodeConstants.ORGAO_ACCESS_FORBIDDEN
  | typeof ErrorCodeConstants.ORGAO_CREATE_FAILED
  | typeof ErrorCodeConstants.ORGAO_UPDATE_FAILED
  | typeof ErrorCodeConstants.ORGAO_GET_FAILED
  | typeof ErrorCodeConstants.ORGAO_DELETE_FAILED
  | typeof ErrorCodeConstants.ORGAO_HAS_LINKED_SETORES
  | typeof ErrorCodeConstants.ORGAO_HAS_LINKED_USERS
  | typeof ErrorCodeConstants.ORGAO_HAS_LINKED_OBRAS;

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
