import AppException from '@/core/exceptions/app_exception';
export default class EmpresaRepositoryException extends AppException {
  constructor(p: { code: string; statusCode?: number; cause?: unknown }) {
    super({ code: p.code, statusCode: p.statusCode ?? 500, cause: p.cause });
  }
}
