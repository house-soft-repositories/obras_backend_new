import type UseCase from '@/core/types/use_case';
import EstagioEntity from '@/modules/cronograma/domain/entities/estagio.entity';

export interface AssumirEstagioParam {
  obraId: string;
  id: string;
  responsavelUsuarioId: string;
}

type IAssumirEstagioUseCase = UseCase<AssumirEstagioParam, EstagioEntity>;
export default IAssumirEstagioUseCase;
