import AppException from '@/core/exceptions/app_exception';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
export default class PessoaRepositoryException extends AppException { constructor(p:{code:any,statusCode:number,cause?:unknown}){ super(p); } }
