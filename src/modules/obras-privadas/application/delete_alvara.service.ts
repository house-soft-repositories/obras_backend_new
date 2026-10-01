import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import type { Unit } from '@/core/types/unit';
import { left } from '@/core/types/either';
import IAlvaraRepository from '@/modules/obras-privadas/adapters/alvara_repository.interface';
import IDeleteAlvaraUseCase, {
  DeleteAlvaraParam,
} from '@/modules/obras-privadas/domain/usecase/delete_alvara.usecase';
import ObraPrivadaServiceException from '@/modules/obras-privadas/exceptions/obra_privada_service.exception';

export default class DeleteAlvaraService implements IDeleteAlvaraUseCase {
  constructor(private readonly alvaraRepository: IAlvaraRepository) {}

  async execute(param: DeleteAlvaraParam): AsyncResult<AppException, Unit> {
    const found = await this.alvaraRepository.findById(param.id);
    if (found.isLeft()) return left(found.value);
    if (!found.value) {
      return left(
        new ObraPrivadaServiceException({
          code: ErrorCodeConstants.ALVARA_NOT_FOUND,
          statusCode: 404,
        }),
      );
    }
    return this.alvaraRepository.delete(param.id);
  }
}
