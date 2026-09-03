import AppException from '@/core/exceptions/app_exception';
import ErrorCodeConstants from '@/core/constants/error_code.constants';

type TenancyDomainErrorCode =
  | typeof ErrorCodeConstants.TENANCY_INVALID_NAME
  | typeof ErrorCodeConstants.TENANCY_INVALID_SLUG
  | typeof ErrorCodeConstants.TENANCY_INVALID_CNPJ;

export default class TenancyDomainException extends AppException {
  constructor({ code, message }: { code: TenancyDomainErrorCode; message?: string }) {
    super({ code, statusCode: 400, message });
  }
}
