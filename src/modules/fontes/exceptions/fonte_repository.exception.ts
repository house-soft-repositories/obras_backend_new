import AppException from '@/core/exceptions/app_exception';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
export default class FonteRepositoryException extends AppException {
  constructor(p:{code: typeof ErrorCodeConstants.FONTE_REPOSITORY_FAILED | typeof ErrorCodeConstants.FONTE_NOT_FOUND | typeof ErrorCodeConstants.FONTE_DUPLICATE_CODE, statusCode:number, cause?:unknown}){ super(p); }
}
