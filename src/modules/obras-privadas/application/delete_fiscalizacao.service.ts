import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import type { Unit } from '@/core/types/unit';
import { left } from '@/core/types/either';
import IFiscalizacaoRepository from '@/modules/obras-privadas/adapters/fiscalizacao_repository.interface';
import IDeleteFiscalizacaoUseCase, {
  DeleteFiscalizacaoParam,
} from '@/modules/obras-privadas/domain/usecase/delete_fiscalizacao.usecase';
import ObraPrivadaServiceException from '@/modules/obras-privadas/exceptions/obra_privada_service.exception';

export default class DeleteFiscalizacaoService implements IDeleteFiscalizacaoUseCase {
  constructor(
    private readonly fiscalizacaoRepository: IFiscalizacaoRepository,
  ) {}
  async execute(
    param: DeleteFiscalizacaoParam,
  ): AsyncResult<AppException, Unit> {
    const found = await this.fiscalizacaoRepository.findById(param.id);
    if (found.isLeft()) return left(found.value);
    if (!found.value)
      return left(
        new ObraPrivadaServiceException({
          code: ErrorCodeConstants.FISCALIZACAO_NOT_FOUND,
          statusCode: 404,
        }),
      );
    return this.fiscalizacaoRepository.delete(param.id);
  }
}
