import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import IObraPrivadaObservacaoRepository from '@/modules/obras-privadas/adapters/obra_privada_observacao_repository.interface';
import ObraPrivadaObservacaoEntity from '@/modules/obras-privadas/domain/entities/obra_privada_observacao.entity';
import IListObraPrivadaObservacoesUseCase, {
  ListObraPrivadaObservacoesParam,
} from '@/modules/obras-privadas/domain/usecase/list_obra_privada_observacoes.usecase';

export default class ListObraPrivadaObservacoesService implements IListObraPrivadaObservacoesUseCase {
  constructor(
    private readonly observacaoRepository: IObraPrivadaObservacaoRepository,
  ) {}
  async execute(
    param: ListObraPrivadaObservacoesParam,
  ): AsyncResult<AppException, ObraPrivadaObservacaoEntity[]> {
    return this.observacaoRepository.findByObraPrivadaId(param.obraPrivadaId);
  }
}
