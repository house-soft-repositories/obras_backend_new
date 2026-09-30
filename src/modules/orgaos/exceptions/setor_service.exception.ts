import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';

type SetorServiceErrorCode =
  | typeof ErrorCodeConstants.SETOR_ACCESS_FORBIDDEN
  | typeof ErrorCodeConstants.SETOR_CREATE_FAILED
  | typeof ErrorCodeConstants.SETOR_UPDATE_FAILED
  | typeof ErrorCodeConstants.SETOR_GET_FAILED
  | typeof ErrorCodeConstants.SETOR_DELETE_FAILED
  | typeof ErrorCodeConstants.SETOR_HAS_LINKED_USERS
  | typeof ErrorCodeConstants.SETOR_HAS_LINKED_OBRAS
  | typeof ErrorCodeConstants.SETOR_NOT_FOUND;

export default class SetorServiceException extends AppException {
  constructor({
    code,
    statusCode,
    cause,
  }: {
    code: SetorServiceErrorCode;
    statusCode: number;
    cause?: unknown;
  }) {
    super({ code, statusCode, cause });
  }
}
