import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';

type LocalidadeDomainErrorCode =
  | typeof ErrorCodeConstants.LOCALIDADE_INVALID_NAME
  | typeof ErrorCodeConstants.LOCALIDADE_INVALID_UF
  | typeof ErrorCodeConstants.LOCALIDADE_INVALID_TYPE;

export default class LocalidadeDomainException extends AppException {
  constructor({ code }: { code: LocalidadeDomainErrorCode }) {
    super({ code, statusCode: 400 });
  }
}
