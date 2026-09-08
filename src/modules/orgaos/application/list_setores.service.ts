import AppException from '@/core/exceptions/app_exception';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import AsyncResult from '@/core/types/async_result';
import ISetorRepository from '@/modules/orgaos/adapters/setor_repository.interface';
import IListSetoresUseCase, {
  ListSetoresParam,
} from '@/modules/orgaos/domain/usecase/list_setores.usecase';
import { SetorWithOrgaoReadModel } from '@/modules/orgaos/infra/read-models/setor_with_orgao_read_model';

export default class ListSetoresService implements IListSetoresUseCase {
  constructor(private readonly repository: ISetorRepository) {}

  async execute(
    param: ListSetoresParam,
  ): AsyncResult<AppException, PageEntity<SetorWithOrgaoReadModel>> {
    const pageOptions = new PageOptionsEntity(
      param.order,
      param.page,
      param.take,
    );
    return this.repository.findAllByOrgao(pageOptions);
  }
}
