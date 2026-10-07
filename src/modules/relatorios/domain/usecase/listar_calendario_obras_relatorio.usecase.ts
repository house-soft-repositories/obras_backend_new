import UseCase from '@/core/types/use_case';
import FiltroObrasDto from '@/modules/relatorios/dtos/filtro_obras.dto';
import { ItemListaObrasRelatorio } from '@/modules/relatorios/domain/relatorios/relatorios_read_models';

export type ListarCalendarioObrasRelatorioParam = FiltroObrasDto & {
  usuarioId: string;
};

type IListarCalendarioObrasRelatorioUseCase = UseCase<
  ListarCalendarioObrasRelatorioParam,
  ItemListaObrasRelatorio[]
>;
export default IListarCalendarioObrasRelatorioUseCase;
