import UseCase from '@/core/types/use_case';
import ObraPrivadaEntity from '@/modules/obras-privadas/domain/entities/obra_privada.entity';

export type ListObrasNoMesmoImovelParam = { id: string };
type IListObrasNoMesmoImovelUseCase = UseCase<
  ListObrasNoMesmoImovelParam,
  ObraPrivadaEntity[]
>;
export default IListObrasNoMesmoImovelUseCase;
