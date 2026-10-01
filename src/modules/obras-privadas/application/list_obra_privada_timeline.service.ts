import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IAlvaraRepository from '@/modules/obras-privadas/adapters/alvara_repository.interface';
import IAutoInfracaoRepository from '@/modules/obras-privadas/adapters/auto_infracao_repository.interface';
import IFiscalizacaoRepository from '@/modules/obras-privadas/adapters/fiscalizacao_repository.interface';
import IHabiteSeRepository from '@/modules/obras-privadas/adapters/habite_se_repository.interface';
import IObraPrivadaObservacaoRepository from '@/modules/obras-privadas/adapters/obra_privada_observacao_repository.interface';
import IListObraPrivadaTimelineUseCase, {
  ListObraPrivadaTimelineParam,
  ObraPrivadaTimelineItem,
} from '@/modules/obras-privadas/domain/usecase/list_obra_privada_timeline.usecase';

export default class ListObraPrivadaTimelineService implements IListObraPrivadaTimelineUseCase {
  constructor(
    private readonly alvaraRepository: IAlvaraRepository,
    private readonly fiscalizacaoRepository: IFiscalizacaoRepository,
    private readonly autoInfracaoRepository: IAutoInfracaoRepository,
    private readonly habiteSeRepository: IHabiteSeRepository,
    private readonly observacaoRepository: IObraPrivadaObservacaoRepository,
  ) {}

  async execute(
    param: ListObraPrivadaTimelineParam,
  ): AsyncResult<AppException, ObraPrivadaTimelineItem[]> {
    const alvaras = await this.alvaraRepository.findByObraPrivadaId(
      param.obraPrivadaId,
    );
    if (alvaras.isLeft()) return left(alvaras.value);
    const fiscalizacoes = await this.fiscalizacaoRepository.findByObraPrivadaId(
      param.obraPrivadaId,
    );
    if (fiscalizacoes.isLeft()) return left(fiscalizacoes.value);
    const autos = await this.autoInfracaoRepository.findByObraPrivadaId(
      param.obraPrivadaId,
    );
    if (autos.isLeft()) return left(autos.value);
    const habiteSes = await this.habiteSeRepository.findByObraPrivadaId(
      param.obraPrivadaId,
    );
    if (habiteSes.isLeft()) return left(habiteSes.value);
    const observacoes = await this.observacaoRepository.findByObraPrivadaId(
      param.obraPrivadaId,
    );
    if (observacoes.isLeft()) return left(observacoes.value);

    const items: ObraPrivadaTimelineItem[] = [
      ...alvaras.value.map((entity) => {
        const value = entity.toObject();
        return {
          id: value.id,
          tipo: 'ALVARA' as const,
          data: value.dataEmissao ?? value.createdAt.toISOString(),
          titulo: value.numero
            ? `Alvará ${value.numero}`
            : `Alvará ${value.ano}`,
          situacao: value.situacao,
          observacoes: value.observacoes,
        };
      }),
      ...fiscalizacoes.value.map((entity) => {
        const value = entity.toObject();
        return {
          id: value.id,
          tipo: 'FISCALIZACAO' as const,
          data: value.dataFiscalizacao,
          titulo: `Fiscalização ${value.numero}`,
          situacao: value.resultado,
          observacoes: value.constatacoes,
        };
      }),
      ...autos.value.map((entity) => {
        const value = entity.toObject();
        return {
          id: value.id,
          tipo: 'AUTO_INFRACAO' as const,
          data: value.dataEmissao,
          titulo: `Auto ${value.numero}`,
          situacao: value.situacao,
          observacoes: value.descricao,
        };
      }),
      ...habiteSes.value.map((entity) => {
        const value = entity.toObject();
        return {
          id: value.id,
          tipo: 'HABITE_SE' as const,
          data: value.dataEmissao ?? value.createdAt.toISOString(),
          titulo: `Habite-se ${value.numero}`,
          situacao: value.resultado,
          observacoes: value.parecer,
        };
      }),
      ...observacoes.value.map((entity) => {
        const value = entity.toObject();
        return {
          id: value.id,
          tipo: 'OBSERVACAO' as const,
          data: value.createdAt.toISOString(),
          titulo: 'Observação',
          situacao: null,
          observacoes: value.texto,
        };
      }),
    ];

    return right(items.sort((a, b) => b.data.localeCompare(a.data)));
  }
}
