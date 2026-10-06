import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import IParalisacaoRepository from '@/modules/contratos/adapters/paralisacao_repository.interface';
import ParalisacaoEntity from '@/modules/contratos/domain/entities/paralisacao.entity';
import IListParalisacoesUseCase, {
  ListParalisacoesParam,
} from '@/modules/contratos/domain/usecase/list_paralisacoes.usecase';

export default class ListParalisacoesService
  implements IListParalisacoesUseCase
{
  constructor(private readonly paralisacaoRepo: IParalisacaoRepository) {}

  async execute(
    param: ListParalisacoesParam,
  ): AsyncResult<AppException, ParalisacaoEntity[]> {
    return this.paralisacaoRepo.listByContrato(param.contratoId);
  }
}
