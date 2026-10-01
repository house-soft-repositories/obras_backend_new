import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IAlvaraRepository from '@/modules/obras-privadas/adapters/alvara_repository.interface';
import AlvaraEntity from '@/modules/obras-privadas/domain/entities/alvara.entity';
import IUpdateAlvaraUseCase, {
  UpdateAlvaraParam,
} from '@/modules/obras-privadas/domain/usecase/update_alvara.usecase';
import ObraPrivadaServiceException from '@/modules/obras-privadas/exceptions/obra_privada_service.exception';

export default class UpdateAlvaraService implements IUpdateAlvaraUseCase {
  constructor(private readonly alvaraRepository: IAlvaraRepository) {}

  async execute(
    param: UpdateAlvaraParam,
  ): AsyncResult<AppException, AlvaraEntity> {
    const { id, ...props } = param;
    const updated = await this.alvaraRepository.update(id, props);
    if (updated.isLeft()) return left(updated.value);
    if (!updated.value) {
      return left(
        new ObraPrivadaServiceException({
          code: ErrorCodeConstants.ALVARA_NOT_FOUND,
          statusCode: 404,
        }),
      );
    }
    return right(updated.value);
  }
}
