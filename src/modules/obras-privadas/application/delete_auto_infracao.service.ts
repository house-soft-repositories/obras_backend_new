import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import { unit, type Unit } from '@/core/types/unit';
import IAutoInfracaoRepository from '@/modules/obras-privadas/adapters/auto_infracao_repository.interface';
import IDeleteAutoInfracaoUseCase, {
  DeleteAutoInfracaoParam,
} from '@/modules/obras-privadas/domain/usecase/delete_auto_infracao.usecase';
import AutoInfracaoRepositoryException from '@/modules/obras-privadas/exceptions/auto_infracao_repository.exception';

export default class DeleteAutoInfracaoService implements IDeleteAutoInfracaoUseCase {
  constructor(private readonly repo: IAutoInfracaoRepository) {}

  async execute(
    param: DeleteAutoInfracaoParam,
  ): AsyncResult<AppException, Unit> {
    try {
      const found = await this.repo.findById(param.id);
      if (found.isLeft()) return left(found.value);
      if (!found.value)
        return left(
          new AutoInfracaoRepositoryException({
            code: ErrorCodeConstants.AUTO_INFRACAO_NOT_FOUND,
            statusCode: 404,
          }),
        );
      if (found.value.obraPrivadaId !== param.obraPrivadaId) {
        return left(
          new AutoInfracaoRepositoryException({
            code: ErrorCodeConstants.AUTO_INFRACAO_NOT_FOUND,
            statusCode: 404,
          }),
        );
      }
      const deleted = await this.repo.delete(param.id);
      if (deleted.isLeft()) return left(deleted.value);
      return right(unit);
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(
        new AutoInfracaoRepositoryException({
          code: ErrorCodeConstants.AUTO_INFRACAO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }
}
