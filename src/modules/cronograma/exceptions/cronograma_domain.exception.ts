import AppException from '@/core/exceptions/app_exception';
export default class CronogramaDomainException extends AppException {
  constructor(p: { code: string }) {
    super({ code: p.code, statusCode: 400 });
  }
}
