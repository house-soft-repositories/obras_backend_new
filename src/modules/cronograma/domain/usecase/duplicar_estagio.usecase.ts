import type UseCase from '@/core/types/use_case';
import EstagioEntity from '@/modules/cronograma/domain/entities/estagio.entity';

export interface DuplicarEstagioParam {
  obraId: string;
  id: string;
}

type IDuplicarEstagioUseCase = UseCase<DuplicarEstagioParam, EstagioEntity>;
export default IDuplicarEstagioUseCase;
