import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';

export default class StorageException extends AppException {
  constructor({
    code,
    statusCode,
    cause,
  }: {
    code:
      | typeof ErrorCodeConstants.STORAGE_BUCKET_FAILED
      | typeof ErrorCodeConstants.STORAGE_PUT_FAILED
      | typeof ErrorCodeConstants.STORAGE_DELETE_FAILED
      | typeof ErrorCodeConstants.STORAGE_PRESIGN_FAILED
      | typeof ErrorCodeConstants.STORAGE_PROVISION_FAILED;
    statusCode: number;
    cause?: unknown;
  }) {
    super({ code, statusCode, cause });
  }
}
