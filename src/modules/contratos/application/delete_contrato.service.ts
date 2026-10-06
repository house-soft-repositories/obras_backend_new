import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IContratoRepository from '@/modules/contratos/adapters/contrato_repository.interface';
import IDeleteContratoUseCase, {
  DeleteContratoParam,
} from '@/modules/contratos/domain/usecase/delete_contrato.usecase';
import GetContratoService from '@/modules/contratos/application/get_contrato.service';

export default class DeleteContratoService implements IDeleteContratoUseCase {
  private readonly getter: GetContratoService;

  constructor(private readonly contratoRepo: IContratoRepository) {
    this.getter = new GetContratoService(contratoRepo);
  }

  async execute(param: DeleteContratoParam): AsyncResult<AppException, void> {
    const found = await this.getter.execute({ id: param.id });
    if (found.isLeft()) return left(found.value);
    const res = await this.contratoRepo.delete(param.id);
    if (res.isLeft()) return left(res.value);
    return right(undefined);
  }
}
