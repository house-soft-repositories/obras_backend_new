import AppException from '@/core/exceptions/app_exception';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
export default class FonteServiceException extends AppException {
  constructor(p:{code: typeof ErrorCodeConstants.FONTE_CREATE_FAILED | typeof ErrorCodeConstants.FONTE_ACCESS_FORBIDDEN | typeof ErrorCodeConstants.FONTE_DUPLICATE_CODE, statusCode:number, cause?:unknown}){ super(p); }
}
