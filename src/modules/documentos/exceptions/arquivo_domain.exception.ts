import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';

export default class ArquivoDomainException extends AppException {
  constructor({
    code,
  }: {
    code: typeof ErrorCodeConstants.ARQUIVO_INVALID_INPUT;
  }) {
    super({ code, statusCode: 400 });
  }
}
