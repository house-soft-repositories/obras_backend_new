import AppException from '@/core/exceptions/app_exception';
export default class ObraDomainException extends AppException { constructor(p:{code:any}){ super({code:p.code,statusCode:422}); } }
