import type UseCase from '@/core/types/use_case';
import EstagioEntity from '@/modules/cronograma/domain/entities/estagio.entity';

export interface CreateEstagioParam {
  obraId: string;
  nome: string;
  posicao?: number;
  dataInicio?: string;
  dataFim?: string;
  responsavelUsuarioId?: string;
  estagioPaiId?: string;
}

type ICreateEstagioUseCase = UseCase<CreateEstagioParam, EstagioEntity>;
export default ICreateEstagioUseCase;
