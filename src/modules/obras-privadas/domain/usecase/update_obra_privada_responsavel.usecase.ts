import UseCase from '@/core/types/use_case';
import { ObraPrivadaResponsavelResponse } from '@/modules/obras-privadas/domain/usecase/obra_privada_responsavel.response';
import { CreateObraPrivadaResponsavelParam } from '@/modules/obras-privadas/domain/usecase/create_obra_privada_responsavel.usecase';

export type UpdateObraPrivadaResponsavelParam = {
  id: string;
  obraPrivadaId: string;
} & Partial<
  Omit<CreateObraPrivadaResponsavelParam, 'tenantId' | 'obraPrivadaId'>
>;

type IUpdateObraPrivadaResponsavelUseCase = UseCase<
  UpdateObraPrivadaResponsavelParam,
  ObraPrivadaResponsavelResponse
>;
export default IUpdateObraPrivadaResponsavelUseCase;
