import type UseCase from '@/core/types/use_case';
import ObservacaoEntity from '@/modules/obras/domain/entities/observacao.entity';

export interface CreateObservacaoParam {
  obraId: string;
  texto: string;
}

type IObservacoesUseCase = UseCase<CreateObservacaoParam, ObservacaoEntity>;
export default IObservacoesUseCase;
