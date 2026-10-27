import UseCase from '@/core/types/use_case';
import { ObraPrivadaResponsaveisResponse } from '@/modules/obras-privadas/domain/usecase/obra_privada_responsavel.response';

export type ListObraPrivadaResponsaveisParam = { obraPrivadaId: string };

type IListObraPrivadaResponsaveisUseCase = UseCase<
  ListObraPrivadaResponsaveisParam,
  ObraPrivadaResponsaveisResponse
>;
export default IListObraPrivadaResponsaveisUseCase;
