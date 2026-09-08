import AppException from '@/core/exceptions/app_exception';
export default class ObraPrivadaDomainException extends AppException { constructor(p:{code:any}){ super({code:p.code,statusCode:400}); } }
