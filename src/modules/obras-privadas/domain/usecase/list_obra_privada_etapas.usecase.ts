import UseCase from '@/core/types/use_case';

export type ListObraPrivadaEtapasParam = { obraPrivadaId: string };
export type ObraPrivadaEtapaResumo = {
  etapa: string;
  ultimaConstatacao: string;
  total: number;
};
type IListObraPrivadaEtapasUseCase = UseCase<
  ListObraPrivadaEtapasParam,
  ObraPrivadaEtapaResumo[]
>;
export default IListObraPrivadaEtapasUseCase;
