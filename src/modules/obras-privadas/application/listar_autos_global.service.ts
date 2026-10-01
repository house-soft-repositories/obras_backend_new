import AppException from '@/core/exceptions/app_exception';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import AsyncResult from '@/core/types/async_result';
import IAutoInfracaoRepository from '@/modules/obras-privadas/adapters/auto_infracao_repository.interface';
import IListarAutosGlobalUseCase, {
  ListarAutosGlobalParam,
} from '@/modules/obras-privadas/domain/usecase/listar_autos_global.usecase';
import { AutoGlobalReadModel } from '@/modules/obras-privadas/infra/read-models/auto_global_read_model';

export default class ListarAutosGlobalService implements IListarAutosGlobalUseCase {
  constructor(private readonly autos: IAutoInfracaoRepository) {}

  async execute(
    param: ListarAutosGlobalParam,
  ): AsyncResult<AppException, PageEntity<AutoGlobalReadModel>> {
    const { page, take, order, ...query } = param;
    return this.autos.listGlobal(
      new PageOptionsEntity(order, page, take),
      query,
    );
  }
}
