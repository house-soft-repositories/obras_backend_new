import AppException from '@/core/exceptions/app_exception';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import AsyncResult from '@/core/types/async_result';
import ILocalidadeRepository from '@/modules/localidades/adapters/localidade_repository.interface';
import LocalidadeEntity from '@/modules/localidades/domain/entities/localidade.entity';
import IListLocalidadesUseCase, {
  ListLocalidadesParam,
} from '@/modules/localidades/domain/usecase/list_localidades.usecase';

export default class ListLocalidadesService implements IListLocalidadesUseCase {
  constructor(private readonly repository: ILocalidadeRepository) {}

  async execute(
    param: ListLocalidadesParam,
  ): AsyncResult<AppException, PageEntity<LocalidadeEntity>> {
    const pageOptions = new PageOptionsEntity(
      param.order,
      param.page,
      param.take,
    );
    return this.repository.findAll(pageOptions);
  }
}
