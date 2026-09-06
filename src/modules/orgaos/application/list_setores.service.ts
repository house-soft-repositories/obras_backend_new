import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import ISetorRepository from '@/modules/orgaos/adapters/setor_repository.interface';
import { denyUnlessSetorReader } from '@/modules/orgaos/application/orgao_authorization';
import SetorEntity from '@/modules/orgaos/domain/entities/setor.entity';
import IListSetoresUseCase, {
  ListSetoresParam,
} from '@/modules/orgaos/domain/usecase/list_setores.usecase';

export default class ListSetoresService implements IListSetoresUseCase {
  constructor(private readonly repository: ISetorRepository) {}

  async execute(
    param: ListSetoresParam,
  ): AsyncResult<AppException, SetorEntity[]> {
    const denied = denyUnlessSetorReader(param.role);
    if (denied) return left(denied);
    const orgao = await this.repository.existsOrgao(param.orgaoId);
    if (orgao.isLeft()) return left(orgao.value);
    return this.repository.findAllByOrgao(param.orgaoId);
  }
}
