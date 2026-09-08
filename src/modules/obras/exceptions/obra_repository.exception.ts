import AppException from '@/core/exceptions/app_exception';
export default class ObraRepositoryException extends AppException { constructor(p:{code:any,statusCode:number,cause?:unknown}){ super(p); } }
