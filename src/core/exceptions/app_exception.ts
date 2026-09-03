export interface AppExceptionParams {
  code: string;
  statusCode: number;
  message?: string;
  cause?: unknown;
}

export default class AppException extends Error {
  readonly code: string;

  readonly statusCode: number;

  readonly cause?: unknown;

  constructor({ code, statusCode, message, cause }: AppExceptionParams) {
    super(message ?? code);
    this.code = code;
    this.statusCode = statusCode;
    this.cause = cause;
  }
}
