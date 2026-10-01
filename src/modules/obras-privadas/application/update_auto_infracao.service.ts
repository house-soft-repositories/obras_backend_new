import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IAutoInfracaoRepository from '@/modules/obras-privadas/adapters/auto_infracao_repository.interface';
import AutoInfracaoEntity from '@/modules/obras-privadas/domain/entities/auto_infracao.entity';
import IUpdateAutoInfracaoUseCase, {
  UpdateAutoInfracaoParam,
} from '@/modules/obras-privadas/domain/usecase/update_auto_infracao.usecase';
import ObraPrivadaServiceException from '@/modules/obras-privadas/exceptions/obra_privada_service.exception';
export default class UpdateAutoInfracaoService implements IUpdateAutoInfracaoUseCase {
  constructor(private readonly autoRepository: IAutoInfracaoRepository) {}
  async execute(
    param: UpdateAutoInfracaoParam,
  ): AsyncResult<AppException, AutoInfracaoEntity> {
    const { id, ...props } = param;
    const updated = await this.autoRepository.update(id, props);
    if (updated.isLeft()) return left(updated.value);
    if (!updated.value)
      return left(
        new ObraPrivadaServiceException({
          code: ErrorCodeConstants.AUTO_INFRACAO_NOT_FOUND,
          statusCode: 404,
        }),
      );
    return right(updated.value);
  }
}
