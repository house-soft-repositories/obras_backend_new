import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IEmpresaContratadaRepository from '@/modules/contratos/adapters/empresa_contratada_repository.interface';
import IDeleteEmpresaContratadaUseCase, {
  DeleteEmpresaContratadaParam,
} from '@/modules/contratos/domain/usecase/delete_empresa_contratada.usecase';
import GetEmpresaContratadaService from '@/modules/contratos/application/get_empresa_contratada.service';

export default class DeleteEmpresaContratadaService
  implements IDeleteEmpresaContratadaUseCase
{
  private readonly getter: GetEmpresaContratadaService;

  constructor(private readonly repo: IEmpresaContratadaRepository) {
    this.getter = new GetEmpresaContratadaService(repo);
  }

  async execute(
    param: DeleteEmpresaContratadaParam,
  ): AsyncResult<AppException, void> {
    const found = await this.getter.execute({ id: param.id });
    if (found.isLeft()) return left(found.value);
    const res = await this.repo.delete(param.id);
    if (res.isLeft()) return left(res.value);
    return right(undefined);
  }
}
