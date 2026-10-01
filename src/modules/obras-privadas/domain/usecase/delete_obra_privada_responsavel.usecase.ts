import UseCase from '@/core/types/use_case';
import type { Unit } from '@/core/types/unit';

export type DeleteObraPrivadaResponsavelParam = { id: string };

type IDeleteObraPrivadaResponsavelUseCase = UseCase<
  DeleteObraPrivadaResponsavelParam,
  Unit
>;
export default IDeleteObraPrivadaResponsavelUseCase;
