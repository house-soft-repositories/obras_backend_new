import AppException from '@/core/exceptions/app_exception';

export default class TenancyServiceException extends AppException {
  constructor({
    code,
    statusCode,
    message,
    cause,
  }: {
    code: string
    statusCode: number;
    message?: string;
    cause?: unknown;
  }) {
    super({
      code,
      statusCode,
      message,
      cause,
    });
  }
}
