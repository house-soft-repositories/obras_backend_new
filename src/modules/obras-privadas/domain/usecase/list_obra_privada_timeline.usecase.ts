import UseCase from '@/core/types/use_case';

export type ListObraPrivadaTimelineParam = { obraPrivadaId: string };
export type ObraPrivadaTimelineItem = {
  id: string;
  tipo:
    'ALVARA' | 'FISCALIZACAO' | 'AUTO_INFRACAO' | 'HABITE_SE' | 'OBSERVACAO';
  data: string;
  titulo: string;
  situacao: string | null;
  observacoes: string | null;
};
type IListObraPrivadaTimelineUseCase = UseCase<
  ListObraPrivadaTimelineParam,
  ObraPrivadaTimelineItem[]
>;
export default IListObraPrivadaTimelineUseCase;
