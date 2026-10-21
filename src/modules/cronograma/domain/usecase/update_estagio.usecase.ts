import type UseCase from '@/core/types/use_case';
import EstagioEntity from '@/modules/cronograma/domain/entities/estagio.entity';

export interface UpdateEstagioParam {
  obraId: string;
  id: string;
  nome?: string;
  posicao?: number;
  dataInicio?: string | null;
  dataFim?: string | null;
  responsavelUsuarioId?: string | null;
  estagioPaiId?: string | null;
}

type IUpdateEstagioUseCase = UseCase<UpdateEstagioParam, EstagioEntity>;
export default IUpdateEstagioUseCase;
