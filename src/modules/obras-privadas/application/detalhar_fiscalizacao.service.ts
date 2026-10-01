import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IFiscalizacaoRepository from '@/modules/obras-privadas/adapters/fiscalizacao_repository.interface';
import FiscalizacaoEntity from '@/modules/obras-privadas/domain/entities/fiscalizacao.entity';
import IDetalharFiscalizacaoUseCase, {
  DetalharFiscalizacaoParam,
} from '@/modules/obras-privadas/domain/usecase/detalhar_fiscalizacao.usecase';
import ObraPrivadaServiceException from '@/modules/obras-privadas/exceptions/obra_privada_service.exception';

export default class DetalharFiscalizacaoService implements IDetalharFiscalizacaoUseCase {
  constructor(private readonly fiscalizacoes: IFiscalizacaoRepository) {}

  async execute(
    param: DetalharFiscalizacaoParam,
  ): AsyncResult<AppException, FiscalizacaoEntity> {
    const found = await this.fiscalizacoes.findById(param.id);
    if (found.isLeft()) return left(found.value);
    if (!found.value)
      return left(
        new ObraPrivadaServiceException({
          code: ErrorCodeConstants.FISCALIZACAO_NOT_FOUND,
          statusCode: 404,
        }),
      );
    return right(found.value);
  }
}
