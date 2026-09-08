import AppException from '@/core/exceptions/app_exception';
export default class ObraPrivadaRepositoryException extends AppException { constructor(p:{code:any,statusCode:number,cause?:unknown}){ super(p); } }
