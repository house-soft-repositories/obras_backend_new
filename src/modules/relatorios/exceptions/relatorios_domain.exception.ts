import AppException from '@/core/exceptions/app_exception';
import ErrorCodeConstants from '@/core/constants/error_code.constants';

type RelatoriosDomainErrorCode =
  | typeof ErrorCodeConstants.RELATORIO_FILTRO_INVALIDO
  | typeof ErrorCodeConstants.RELATORIO_PAGINACAO_INVALIDA;

export default class RelatoriosDomainException extends AppException {
  constructor({ code, message }: { code: RelatoriosDomainErrorCode; message?: string }) {
    super({ code, statusCode: 400, message });
  }
}
