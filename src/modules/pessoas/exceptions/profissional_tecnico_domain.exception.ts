import AppException from '@/core/exceptions/app_exception';
import ErrorCodeConstants from '@/core/constants/error_code.constants';

export default class ProfissionalTecnicoDomainException extends AppException {
  constructor(p: {
    code:
      | typeof ErrorCodeConstants.PROFISSIONAL_TECNICO_INVALID_PESSOA
      | typeof ErrorCodeConstants.PROFISSIONAL_TECNICO_INVALID_CONSELHO
      | typeof ErrorCodeConstants.PROFISSIONAL_TECNICO_INVALID_NUMERO_REGISTRO;
  }) {
    super({ code: p.code, statusCode: 400 });
  }
}
