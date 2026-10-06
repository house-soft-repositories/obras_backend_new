import type UseCase from '@/core/types/use_case';
import ParalisacaoEntity from '@/modules/contratos/domain/entities/paralisacao.entity';

export interface ReiniciarParalisacaoParam {
  id: string;
  dataReinicio: string;
  termoRetomadaArquivoId?: string | null;
}

type IReiniciarParalisacaoUseCase = UseCase<
  ReiniciarParalisacaoParam,
  ParalisacaoEntity
>;

export default IReiniciarParalisacaoUseCase;
