import AppException from '@/core/exceptions/app_exception';
import ErrorCodeConstants from '@/core/constants/error_code.constants';

export default class TenantContextException extends AppException {
  constructor({ cause }: { cause?: unknown } = {}) {
    super({
      code: ErrorCodeConstants.TENANT_CONTEXT_REQUIRED,
      statusCode: 401,
      cause,
    });
  }
}
