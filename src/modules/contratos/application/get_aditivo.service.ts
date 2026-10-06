import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IAditivoRepository from '@/modules/contratos/adapters/aditivo_repository.interface';
import AditivoEntity from '@/modules/contratos/domain/entities/aditivo.entity';
import IGetAditivoUseCase, {
  GetAditivoParam,
} from '@/modules/contratos/domain/usecase/get_aditivo.usecase';
import AditivoRepositoryException from '@/modules/contratos/exceptions/aditivo_repository.exception';

export default class GetAditivoService implements IGetAditivoUseCase {
  constructor(private readonly aditivoRepo: IAditivoRepository) {}

  async execute(
    param: GetAditivoParam,
  ): AsyncResult<AppException, AditivoEntity> {
    const res = await this.aditivoRepo.findById(param.id);
    if (res.isLeft()) return left(res.value);
    if (!res.value) {
      return left(
        new AditivoRepositoryException({
          code: ErrorCodeConstants.ADITIVO_NOT_FOUND,
          statusCode: 404,
        }),
      );
    }
    return right(res.value);
  }
}
