import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';

type LocalidadeServiceErrorCode =
  | typeof ErrorCodeConstants.LOCALIDADE_ACCESS_FORBIDDEN
  | typeof ErrorCodeConstants.LOCALIDADE_CREATE_FAILED
  | typeof ErrorCodeConstants.LOCALIDADE_UPDATE_FAILED
  | typeof ErrorCodeConstants.LOCALIDADE_GET_FAILED
  | typeof ErrorCodeConstants.LOCALIDADE_DELETE_FAILED
  | typeof ErrorCodeConstants.LOCALIDADE_HAS_LINKED_ORGAOS
  | typeof ErrorCodeConstants.LOCALIDADE_HAS_LINKED_USERS
  | typeof ErrorCodeConstants.LOCALIDADE_HAS_LINKED_OBRAS;

export default class LocalidadeServiceException extends AppException {
  constructor({
    code,
    statusCode,
    cause,
  }: {
    code: LocalidadeServiceErrorCode;
    statusCode: number;
    cause?: unknown;
  }) {
    super({ code, statusCode, cause });
  }
}
