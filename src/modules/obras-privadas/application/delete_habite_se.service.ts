import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import type { Unit } from '@/core/types/unit';
import { left } from '@/core/types/either';
import IHabiteSeRepository from '@/modules/obras-privadas/adapters/habite_se_repository.interface';
import IDeleteHabiteSeUseCase, {
  DeleteHabiteSeParam,
} from '@/modules/obras-privadas/domain/usecase/delete_habite_se.usecase';
import ObraPrivadaServiceException from '@/modules/obras-privadas/exceptions/obra_privada_service.exception';
export default class DeleteHabiteSeService implements IDeleteHabiteSeUseCase {
  constructor(private readonly habiteSeRepository: IHabiteSeRepository) {}
  async execute(param: DeleteHabiteSeParam): AsyncResult<AppException, Unit> {
    const found = await this.habiteSeRepository.findById(param.id);
    if (found.isLeft()) return left(found.value);
    if (!found.value)
      return left(
        new ObraPrivadaServiceException({
          code: ErrorCodeConstants.HABITE_SE_NOT_FOUND,
          statusCode: 404,
        }),
      );
    return this.habiteSeRepository.delete(param.id);
  }
}
