import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import IOrgaoRepository from '@/modules/orgaos/adapters/orgao_repository.interface';
import OrgaoEntity from '@/modules/orgaos/domain/entities/orgao.entity';
import IListOrgaosByLocalidadeUseCase, {
  ListOrgaosByLocalidadeParam,
} from '@/modules/orgaos/domain/usecase/list_orgaos_by_localidade.usecase';

export default class ListOrgaosByLocalidadeService
  implements IListOrgaosByLocalidadeUseCase
{
  constructor(private readonly repository: IOrgaoRepository) {}

  async execute(
    param: ListOrgaosByLocalidadeParam,
  ): AsyncResult<AppException, OrgaoEntity[]> {
    return this.repository.findAllByLocalidadeId(param.localidadeId);
  }
}
