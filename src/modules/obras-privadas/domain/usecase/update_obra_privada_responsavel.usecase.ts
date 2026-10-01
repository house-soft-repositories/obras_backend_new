import UseCase from '@/core/types/use_case';
import ObraPrivadaResponsavelEntity from '@/modules/obras-privadas/domain/entities/obra_privada_responsavel.entity';
import { CreateObraPrivadaResponsavelParam } from '@/modules/obras-privadas/domain/usecase/create_obra_privada_responsavel.usecase';

export type UpdateObraPrivadaResponsavelParam = { id: string } & Partial<
  Omit<CreateObraPrivadaResponsavelParam, 'tenantId' | 'obraPrivadaId'>
>;

type IUpdateObraPrivadaResponsavelUseCase = UseCase<
  UpdateObraPrivadaResponsavelParam,
  ObraPrivadaResponsavelEntity
>;
export default IUpdateObraPrivadaResponsavelUseCase;
