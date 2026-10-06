import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IParalisacaoRepository from '@/modules/contratos/adapters/paralisacao_repository.interface';
import IDeleteParalisacaoUseCase, {
  DeleteParalisacaoParam,
} from '@/modules/contratos/domain/usecase/delete_paralisacao.usecase';

export default class DeleteParalisacaoService
  implements IDeleteParalisacaoUseCase
{
  constructor(private readonly paralisacaoRepo: IParalisacaoRepository) {}

  async execute(
    param: DeleteParalisacaoParam,
  ): AsyncResult<AppException, void> {
    const res = await this.paralisacaoRepo.delete(param.id);
    if (res.isLeft()) return left(res.value);
    return right(undefined);
  }
}
