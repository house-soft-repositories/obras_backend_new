import AppException from '@/core/exceptions/app_exception';

export default class RelatoriosRepositoryException extends AppException {
  constructor(params: { code: string; statusCode?: number; cause?: unknown }) {
    super({ ...params, statusCode: params.statusCode ?? 500 });
  }
}
