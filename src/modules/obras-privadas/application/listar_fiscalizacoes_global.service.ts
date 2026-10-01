import AppException from '@/core/exceptions/app_exception';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import AsyncResult from '@/core/types/async_result';
import IFiscalizacaoRepository from '@/modules/obras-privadas/adapters/fiscalizacao_repository.interface';
import IListarFiscalizacoesGlobalUseCase, {
  ListarFiscalizacoesGlobalParam,
} from '@/modules/obras-privadas/domain/usecase/listar_fiscalizacoes_global.usecase';
import { FiscalizacaoGlobalReadModel } from '@/modules/obras-privadas/infra/read-models/fiscalizacao_global_read_model';

export default class ListarFiscalizacoesGlobalService implements IListarFiscalizacoesGlobalUseCase {
  constructor(private readonly fiscalizacoes: IFiscalizacaoRepository) {}

  async execute(
    param: ListarFiscalizacoesGlobalParam,
  ): AsyncResult<AppException, PageEntity<FiscalizacaoGlobalReadModel>> {
    const { page, take, order, ...query } = param;
    return this.fiscalizacoes.listGlobal(
      new PageOptionsEntity(order, page, take),
      query,
    );
  }
}
