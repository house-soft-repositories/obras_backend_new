import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import { unit, type Unit } from '@/core/types/unit';
import IAditivoRepository from '@/modules/contratos/adapters/aditivo_repository.interface';
import IDeleteAditivoUseCase, {
  DeleteAditivoParam,
} from '@/modules/contratos/domain/usecase/delete_aditivo.usecase';

export default class DeleteAditivoService implements IDeleteAditivoUseCase {
  constructor(private readonly aditivoRepo: IAditivoRepository) {}

  async execute(param: DeleteAditivoParam): AsyncResult<AppException, Unit> {
    const res = await this.aditivoRepo.delete(param.id);
    if (res.isLeft()) return left(res.value);
    return right(unit);
  }
}
