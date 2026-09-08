import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
export default class FonteDomainException extends AppException {
  constructor({ code }: { code: typeof ErrorCodeConstants.FONTE_INVALID_NAME | typeof ErrorCodeConstants.FONTE_INVALID_CODE | typeof ErrorCodeConstants.FONTE_INVALID_TYPE | typeof ErrorCodeConstants.FONTE_INVALID_VALUE | typeof ErrorCodeConstants.FONTE_INVALID_VIGENCIA }) {
    super({ code, statusCode: 400 });
  }
}
