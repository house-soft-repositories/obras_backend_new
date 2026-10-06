import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import IParalisacaoRepository from '@/modules/contratos/adapters/paralisacao_repository.interface';
import ParalisacaoEntity from '@/modules/contratos/domain/entities/paralisacao.entity';
import IReiniciarParalisacaoUseCase, {
  ReiniciarParalisacaoParam,
} from '@/modules/contratos/domain/usecase/reiniciar_paralisacao.usecase';
import ParalisacaoRepositoryException from '@/modules/contratos/exceptions/paralisacao_repository.exception';

export default class ReiniciarParalisacaoService
  implements IReiniciarParalisacaoUseCase
{
  constructor(private readonly paralisacaoRepo: IParalisacaoRepository) {}

  async execute(
    param: ReiniciarParalisacaoParam,
  ): AsyncResult<AppException, ParalisacaoEntity> {
    try {
      const found = await this.paralisacaoRepo.findById(param.id);
      if (found.isLeft()) return left(found.value);
      if (!found.value) {
        return left(
          new ParalisacaoRepositoryException({
            code: ErrorCodeConstants.PARALISACAO_NOT_FOUND,
            statusCode: 404,
          }),
        );
      }

      found.value.reiniciar(
        param.dataReinicio,
        param.termoRetomadaArquivoId ?? null,
      );

      return this.paralisacaoRepo.save(found.value);
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(
        new ParalisacaoRepositoryException({
          code: ErrorCodeConstants.PARALISACAO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }
}
