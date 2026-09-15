import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';

export default class AttachmentDomainException extends AppException {
  constructor({
    code,
  }: {
    code:
      | typeof ErrorCodeConstants.ATTACHMENT_INVALID_FILE
      | typeof ErrorCodeConstants.ATTACHMENT_INVALID_ENTITY_TYPE
      | typeof ErrorCodeConstants.ATTACHMENT_INVALID_ENTITY
      | typeof ErrorCodeConstants.ATTACHMENT_INVALID_ACTOR;
  }) {
    super({ code, statusCode: 400 });
  }
}
