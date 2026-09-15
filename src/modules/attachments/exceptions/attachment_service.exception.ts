import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';

export default class AttachmentServiceException extends AppException {
  constructor({
    code,
    statusCode,
    cause,
  }: {
    code:
      | typeof ErrorCodeConstants.ATTACHMENT_INVALID_FILE
      | typeof ErrorCodeConstants.ATTACHMENT_INVALID_ENTITY_TYPE
      | typeof ErrorCodeConstants.ATTACHMENT_INVALID_ENTITY
      | typeof ErrorCodeConstants.ATTACHMENT_INVALID_ACTOR
      | typeof ErrorCodeConstants.ATTACHMENT_UPLOAD_FAILED
      | typeof ErrorCodeConstants.ATTACHMENT_BATCH_FAILED
      | typeof ErrorCodeConstants.ATTACHMENT_REPLACE_FAILED
      | typeof ErrorCodeConstants.ATTACHMENT_DELETE_FAILED
      | typeof ErrorCodeConstants.ATTACHMENT_DOWNLOAD_FAILED
      | typeof ErrorCodeConstants.ATTACHMENT_NOT_FOUND;
    statusCode: number;
    cause?: unknown;
  }) {
    super({ code, statusCode, cause });
  }
}
