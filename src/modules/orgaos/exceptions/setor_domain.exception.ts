import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';

type SetorDomainErrorCode =
  | typeof ErrorCodeConstants.SETOR_INVALID_NAME
  | typeof ErrorCodeConstants.SETOR_INVALID_ORGAO;

export default class SetorDomainException extends AppException {
  constructor({ code, cause }: { code: SetorDomainErrorCode; cause?: unknown }) {
    super({ code, statusCode: 400, cause });
  }
}
