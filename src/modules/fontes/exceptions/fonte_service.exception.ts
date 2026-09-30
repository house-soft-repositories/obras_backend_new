import AppException from '@/core/exceptions/app_exception';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
export default class FonteServiceException extends AppException {
  constructor(p:{code: typeof ErrorCodeConstants.FONTE_CREATE_FAILED | typeof ErrorCodeConstants.FONTE_GET_FAILED | typeof ErrorCodeConstants.FONTE_UPDATE_FAILED | typeof ErrorCodeConstants.FONTE_DELETE_FAILED | typeof ErrorCodeConstants.FONTE_ACCESS_FORBIDDEN | typeof ErrorCodeConstants.FONTE_DUPLICATE_CODE | typeof ErrorCodeConstants.FONTE_NOT_FOUND | typeof ErrorCodeConstants.FONTE_INATIVA, statusCode:number, cause?:unknown}){ super(p); }
}
