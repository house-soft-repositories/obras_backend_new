import AppException from '@/core/exceptions/app_exception';
export default class CadastroServiceException extends AppException {
  constructor(p: { code: string; statusCode: number; cause?: unknown }) { super(p); }
}
