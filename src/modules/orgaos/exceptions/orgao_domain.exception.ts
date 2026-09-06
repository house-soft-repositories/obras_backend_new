import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';

type OrgaoDomainErrorCode =
  | typeof ErrorCodeConstants.ORGAO_INVALID_NAME
  | typeof ErrorCodeConstants.ORGAO_INVALID_LOCALIDADE
  | typeof ErrorCodeConstants.ORGAO_INVALID_TYPE
  | typeof ErrorCodeConstants.ORGAO_INVALID_EMAIL;

export default class OrgaoDomainException extends AppException {
  constructor({ code, cause }: { code: OrgaoDomainErrorCode; cause?: unknown }) {
    super({ code, statusCode: 400, cause });
  }
}
