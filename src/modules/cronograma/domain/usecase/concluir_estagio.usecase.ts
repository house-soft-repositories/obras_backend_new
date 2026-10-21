import type UseCase from '@/core/types/use_case';
import EstagioEntity from '@/modules/cronograma/domain/entities/estagio.entity';

export interface ConcluirEstagioParam {
  obraId: string;
  id: string;
}

type IConcluirEstagioUseCase = UseCase<ConcluirEstagioParam, EstagioEntity>;
export default IConcluirEstagioUseCase;
