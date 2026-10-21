import UseCase from '@/core/types/use_case';
import type { Unit } from '@/core/types/unit';

export interface DeleteAutoInfracaoParam {
  id: string;
  obraPrivadaId: string;
}

type IDeleteAutoInfracaoUseCase = UseCase<DeleteAutoInfracaoParam, Unit>;
export default IDeleteAutoInfracaoUseCase;