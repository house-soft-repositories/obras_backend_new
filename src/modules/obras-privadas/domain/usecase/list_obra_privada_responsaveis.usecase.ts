import UseCase from '@/core/types/use_case';
import ObraPrivadaResponsavelEntity from '@/modules/obras-privadas/domain/entities/obra_privada_responsavel.entity';

export type ListObraPrivadaResponsaveisParam = { obraPrivadaId: string };

type IListObraPrivadaResponsaveisUseCase = UseCase<
  ListObraPrivadaResponsaveisParam,
  ObraPrivadaResponsavelEntity[]
>;
export default IListObraPrivadaResponsaveisUseCase;
