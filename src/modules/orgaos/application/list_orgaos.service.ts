import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import IOrgaoRepository from '@/modules/orgaos/adapters/orgao_repository.interface';
import { denyUnlessOrgaoReader } from '@/modules/orgaos/application/orgao_authorization';
import OrgaoEntity from '@/modules/orgaos/domain/entities/orgao.entity';
import IListOrgaosUseCase, {
  ListOrgaosParam,
} from '@/modules/orgaos/domain/usecase/list_orgaos.usecase';

export default class ListOrgaosService implements IListOrgaosUseCase {
  constructor(private readonly repository: IOrgaoRepository) {}

  async execute(param: ListOrgaosParam): AsyncResult<AppException, OrgaoEntity[]> {
    const denied = denyUnlessOrgaoReader(param.role);
    if (denied) return left(denied);
    return this.repository.findAll();
  }
}
