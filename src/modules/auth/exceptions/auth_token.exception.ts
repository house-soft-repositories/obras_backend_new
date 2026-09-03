import AppException from '@/core/exceptions/app_exception';

export default class AuthTokenException extends AppException {
  constructor({ cause }: { cause?: unknown }) {
    super({ code: 'AUTH_INVALID_TOKEN', statusCode: 401, cause });
  }
}
