import UseCase from '@/core/types/use_case';
import FiltroObrasDto from '@/modules/relatorios/dtos/filtro_obras.dto';
import { ListaObrasRelatorio } from '@/modules/relatorios/domain/relatorios/relatorios_read_models';

export type ListarObrasRelatorioParam = FiltroObrasDto & {
  usuarioId: string;
};

type IListarObrasRelatorioUseCase = UseCase<
  ListarObrasRelatorioParam,
  ListaObrasRelatorio
>;
export default IListarObrasRelatorioUseCase;
