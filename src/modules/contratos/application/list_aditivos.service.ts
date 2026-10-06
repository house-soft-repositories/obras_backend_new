import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import IAditivoRepository from '@/modules/contratos/adapters/aditivo_repository.interface';
import AditivoEntity from '@/modules/contratos/domain/entities/aditivo.entity';
import IListAditivosUseCase, {
  ListAditivosParam,
} from '@/modules/contratos/domain/usecase/list_aditivos.usecase';

export default class ListAditivosService implements IListAditivosUseCase {
  constructor(private readonly aditivoRepo: IAditivoRepository) {}

  async execute(
    param: ListAditivosParam,
  ): AsyncResult<AppException, AditivoEntity[]> {
    return this.aditivoRepo.listByContrato(param.contratoId);
  }
}
