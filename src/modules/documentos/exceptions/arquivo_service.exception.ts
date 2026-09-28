import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';

export default class ArquivoServiceException extends AppException {
  constructor({
    code,
    statusCode,
    cause,
  }: {
    code:
      | typeof ErrorCodeConstants.ARQUIVO_UPLOAD_FAILED
      | typeof ErrorCodeConstants.ARQUIVO_CONFIRM_FAILED
      | typeof ErrorCodeConstants.ARQUIVO_MOVE_FORBIDDEN
      | typeof ErrorCodeConstants.ARQUIVO_CREATE_FAILED
      | typeof ErrorCodeConstants.ARQUIVO_DELETE_FAILED
      | typeof ErrorCodeConstants.ARQUIVO_INVALID_INPUT
      | typeof ErrorCodeConstants.DOCUMENTO_DUPLICATE_FAILED;
    statusCode: number;
    cause?: unknown;
  }) {
    super({ code, statusCode, cause });
  }
}
