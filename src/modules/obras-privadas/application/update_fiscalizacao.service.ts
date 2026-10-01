import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IFiscalizacaoRepository from '@/modules/obras-privadas/adapters/fiscalizacao_repository.interface';
import FiscalizacaoEntity from '@/modules/obras-privadas/domain/entities/fiscalizacao.entity';
import IUpdateFiscalizacaoUseCase, {
  UpdateFiscalizacaoParam,
} from '@/modules/obras-privadas/domain/usecase/update_fiscalizacao.usecase';
import ObraPrivadaServiceException from '@/modules/obras-privadas/exceptions/obra_privada_service.exception';

export default class UpdateFiscalizacaoService implements IUpdateFiscalizacaoUseCase {
  constructor(
    private readonly fiscalizacaoRepository: IFiscalizacaoRepository,
  ) {}
  async execute(
    param: UpdateFiscalizacaoParam,
  ): AsyncResult<AppException, FiscalizacaoEntity> {
    const { id, ...props } = param;
    const updated = await this.fiscalizacaoRepository.update(id, props);
    if (updated.isLeft()) return left(updated.value);
    if (!updated.value)
      return left(
        new ObraPrivadaServiceException({
          code: ErrorCodeConstants.FISCALIZACAO_NOT_FOUND,
          statusCode: 404,
        }),
      );
    return right(updated.value);
  }
}
