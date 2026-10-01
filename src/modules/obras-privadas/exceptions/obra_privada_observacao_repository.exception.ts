import AppException from '@/core/exceptions/app_exception';

export default class ObraPrivadaObservacaoRepositoryException extends AppException {
  constructor(params: { code: string; statusCode: number; cause?: unknown }) {
    super(params);
  }
}
