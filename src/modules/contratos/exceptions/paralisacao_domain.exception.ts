import AppException from '@/core/exceptions/app_exception';
export default class ParalisacaoDomainException extends AppException {
  constructor(p: { code: string; statusCode?: number; cause?: unknown }) {
    super({ code: p.code, statusCode: p.statusCode ?? 422, cause: p.cause });
  }
}
