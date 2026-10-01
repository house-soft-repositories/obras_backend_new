import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import type { Unit } from '@/core/types/unit';
import { left } from '@/core/types/either';
import IObraPrivadaObservacaoRepository from '@/modules/obras-privadas/adapters/obra_privada_observacao_repository.interface';
import IDeleteObraPrivadaObservacaoUseCase, {
  DeleteObraPrivadaObservacaoParam,
} from '@/modules/obras-privadas/domain/usecase/delete_obra_privada_observacao.usecase';
import ObraPrivadaServiceException from '@/modules/obras-privadas/exceptions/obra_privada_service.exception';

export default class DeleteObraPrivadaObservacaoService implements IDeleteObraPrivadaObservacaoUseCase {
  constructor(
    private readonly observacaoRepository: IObraPrivadaObservacaoRepository,
  ) {}
  async execute(
    param: DeleteObraPrivadaObservacaoParam,
  ): AsyncResult<AppException, Unit> {
    const found = await this.observacaoRepository.findById(param.id);
    if (found.isLeft()) return left(found.value);
    if (!found.value)
      return left(
        new ObraPrivadaServiceException({
          code: ErrorCodeConstants.OBRA_PRIVADA_OBSERVACAO_NOT_FOUND,
          statusCode: 404,
        }),
      );
    return this.observacaoRepository.delete(param.id);
  }
}
