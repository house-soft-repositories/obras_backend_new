import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import IFiscalizacaoRepository from '@/modules/obras-privadas/adapters/fiscalizacao_repository.interface';
import FiscalizacaoEntity from '@/modules/obras-privadas/domain/entities/fiscalizacao.entity';
import IListFiscalizacoesUseCase, {
  ListFiscalizacoesParam,
} from '@/modules/obras-privadas/domain/usecase/list_fiscalizacoes.usecase';

export default class ListFiscalizacoesService implements IListFiscalizacoesUseCase {
  constructor(
    private readonly fiscalizacaoRepository: IFiscalizacaoRepository,
  ) {}
  async execute(
    param: ListFiscalizacoesParam,
  ): AsyncResult<AppException, FiscalizacaoEntity[]> {
    return this.fiscalizacaoRepository.findByObraPrivadaId(param.obraPrivadaId);
  }
}
