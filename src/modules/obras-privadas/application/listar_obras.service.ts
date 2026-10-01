import AppException from '@/core/exceptions/app_exception';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import AsyncResult from '@/core/types/async_result';
import IObraPrivadaRepository from '@/modules/obras-privadas/adapters/obra_privada_repository.interface';
import IListarObrasUseCase, {
  ListarObrasParam,
} from '@/modules/obras-privadas/domain/usecase/listar_obras.usecase';
import { ObraPrivadaListReadModel } from '@/modules/obras-privadas/infra/read-models/obra_privada_list_read_model';

export default class ListarObrasService implements IListarObrasUseCase {
  constructor(private readonly obras: IObraPrivadaRepository) {}

  async execute(
    param: ListarObrasParam,
  ): AsyncResult<AppException, PageEntity<ObraPrivadaListReadModel>> {
    const { page, take, order, ...query } = param;
    return this.obras.listObras(
      new PageOptionsEntity(order, page, take),
      query,
    );
  }
}
