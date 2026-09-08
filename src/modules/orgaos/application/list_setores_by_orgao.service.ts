import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import ISetorRepository from '@/modules/orgaos/adapters/setor_repository.interface';
import IListSetoresByOrgaoUseCase, {
  ListSetoresByOrgaoParam,
} from '@/modules/orgaos/domain/usecase/list_setores_by_orgao.usecase';
import { SetorWithOrgaoReadModel } from '@/modules/orgaos/infra/read-models/setor_with_orgao_read_model';

export default class ListSetoresByOrgaoService implements IListSetoresByOrgaoUseCase {
  constructor(private readonly repository: ISetorRepository) {}

  async execute(
    param: ListSetoresByOrgaoParam,
  ): AsyncResult<AppException, SetorWithOrgaoReadModel[]> {
    return this.repository.findAllByOrgaoId(param.orgaoId);
  }
}
