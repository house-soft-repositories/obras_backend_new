import UseCase from '@/core/types/use_case';
import type { Unit } from '@/core/types/unit';

export type DeleteObraPrivadaObservacaoParam = { id: string };
type IDeleteObraPrivadaObservacaoUseCase = UseCase<
  DeleteObraPrivadaObservacaoParam,
  Unit
>;
export default IDeleteObraPrivadaObservacaoUseCase;
