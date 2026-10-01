import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IHabiteSeRepository from '@/modules/obras-privadas/adapters/habite_se_repository.interface';
import HabiteSeEntity from '@/modules/obras-privadas/domain/entities/habite_se.entity';
import IUpdateHabiteSeUseCase, {
  UpdateHabiteSeParam,
} from '@/modules/obras-privadas/domain/usecase/update_habite_se.usecase';
import ObraPrivadaServiceException from '@/modules/obras-privadas/exceptions/obra_privada_service.exception';
export default class UpdateHabiteSeService implements IUpdateHabiteSeUseCase {
  constructor(private readonly habiteSeRepository: IHabiteSeRepository) {}
  async execute(
    param: UpdateHabiteSeParam,
  ): AsyncResult<AppException, HabiteSeEntity> {
    const { id, ...props } = param;
    const updated = await this.habiteSeRepository.update(id, props);
    if (updated.isLeft()) return left(updated.value);
    if (!updated.value)
      return left(
        new ObraPrivadaServiceException({
          code: ErrorCodeConstants.HABITE_SE_NOT_FOUND,
          statusCode: 404,
        }),
      );
    return right(updated.value);
  }
}
