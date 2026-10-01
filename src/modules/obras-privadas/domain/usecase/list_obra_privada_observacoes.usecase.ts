import UseCase from '@/core/types/use_case';
import ObraPrivadaObservacaoEntity from '@/modules/obras-privadas/domain/entities/obra_privada_observacao.entity';

export type ListObraPrivadaObservacoesParam = { obraPrivadaId: string };
type IListObraPrivadaObservacoesUseCase = UseCase<
  ListObraPrivadaObservacoesParam,
  ObraPrivadaObservacaoEntity[]
>;
export default IListObraPrivadaObservacoesUseCase;
