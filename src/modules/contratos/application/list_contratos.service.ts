import AppException from '@/core/exceptions/app_exception';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import AsyncResult from '@/core/types/async_result';
import IContratoRepository from '@/modules/contratos/adapters/contrato_repository.interface';
import ContratoEntity from '@/modules/contratos/domain/entities/contrato.entity';
import IListContratosUseCase, {
  ListContratosParam,
} from '@/modules/contratos/domain/usecase/list_contratos.usecase';

export default class ListContratosService implements IListContratosUseCase {
  constructor(private readonly contratoRepo: IContratoRepository) {}

  async execute(
    param: ListContratosParam,
  ): AsyncResult<AppException, PageEntity<ContratoEntity>> {
    return this.contratoRepo.findPage(param.pageOptions);
  }
}
