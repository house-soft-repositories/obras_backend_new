import AppException from '@/core/exceptions/app_exception';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import AsyncResult from '@/core/types/async_result';
import IObraPrivadaRepository from '@/modules/obras-privadas/adapters/obra_privada_repository.interface';
import IListarLicenciamentoUseCase, {
  ListarLicenciamentoParam,
} from '@/modules/obras-privadas/domain/usecase/listar_licenciamento.usecase';
import { LicenciamentoListReadModel } from '@/modules/obras-privadas/infra/read-models/licenciamento_list_read_model';

export default class ListarLicenciamentoService implements IListarLicenciamentoUseCase {
  constructor(private readonly obras: IObraPrivadaRepository) {}

  async execute(
    param: ListarLicenciamentoParam,
  ): AsyncResult<AppException, PageEntity<LicenciamentoListReadModel>> {
    const { page, take, order, ...query } = param;
    return this.obras.listLicenciamento(
      new PageOptionsEntity(order, page, take),
      query,
    );
  }
}
