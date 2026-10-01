import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IFiscalizacaoRepository from '@/modules/obras-privadas/adapters/fiscalizacao_repository.interface';
import IListObraPrivadaEtapasUseCase, {
  ListObraPrivadaEtapasParam,
  ObraPrivadaEtapaResumo,
} from '@/modules/obras-privadas/domain/usecase/list_obra_privada_etapas.usecase';

export default class ListObraPrivadaEtapasService implements IListObraPrivadaEtapasUseCase {
  constructor(
    private readonly fiscalizacaoRepository: IFiscalizacaoRepository,
  ) {}
  async execute(
    param: ListObraPrivadaEtapasParam,
  ): AsyncResult<AppException, ObraPrivadaEtapaResumo[]> {
    const result = await this.fiscalizacaoRepository.findByObraPrivadaId(
      param.obraPrivadaId,
    );
    if (result.isLeft()) return left(result.value);
    const grouped = new Map<string, ObraPrivadaEtapaResumo>();
    for (const fiscalizacao of result.value) {
      const item = fiscalizacao.toObject();
      if (!item.etapaConstatada) continue;
      const found = grouped.get(item.etapaConstatada);
      if (!found) {
        grouped.set(item.etapaConstatada, {
          etapa: item.etapaConstatada,
          ultimaConstatacao: item.dataFiscalizacao,
          total: 1,
        });
      } else {
        found.total += 1;
        if (item.dataFiscalizacao > found.ultimaConstatacao)
          found.ultimaConstatacao = item.dataFiscalizacao;
      }
    }
    return right(
      Array.from(grouped.values()).sort((a, b) =>
        a.ultimaConstatacao.localeCompare(b.ultimaConstatacao),
      ),
    );
  }
}
