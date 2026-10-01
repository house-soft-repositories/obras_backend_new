import AppException from '@/core/exceptions/app_exception';

export default class AutoInfracaoRepositoryException extends AppException {
  constructor(params: { code: string; statusCode: number; cause?: unknown }) {
    super(params);
  }
}
