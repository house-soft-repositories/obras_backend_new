import AppException from '@/core/exceptions/app_exception';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
export default class PessoaDomainException extends AppException { constructor(p:{code:typeof ErrorCodeConstants.PESSOA_INVALID_TIPO|typeof ErrorCodeConstants.PESSOA_INVALID_DOCUMENTO|typeof ErrorCodeConstants.PESSOA_INVALID_NOME}){ super({code:p.code,statusCode:400}); } }
