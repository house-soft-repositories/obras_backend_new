import type UseCase from '@/core/types/use_case';
import EstagioEntity from '@/modules/cronograma/domain/entities/estagio.entity';

export interface GetEstagioAtualParam {
  obraId: string;
}

type IGetEstagioAtualUseCase = UseCase<GetEstagioAtualParam, EstagioEntity>;
export default IGetEstagioAtualUseCase;
