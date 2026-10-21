import type UseCase from '@/core/types/use_case';
import EstagioEntity from '@/modules/cronograma/domain/entities/estagio.entity';

export interface GetEstagioParam {
  obraId: string;
  id: string;
}

type IGetEstagioUseCase = UseCase<GetEstagioParam, EstagioEntity>;
export default IGetEstagioUseCase;
