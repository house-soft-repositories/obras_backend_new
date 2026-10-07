import UseCase from '@/core/types/use_case';
import FiltroObrasDto from '@/modules/relatorios/dtos/filtro_obras.dto';
import { DashboardRelatorio } from '@/modules/relatorios/domain/relatorios/relatorios_read_models';

export type DashboardRelatorioParam = FiltroObrasDto & {
  usuarioId: string;
  orgaoId?: string;
};

type IDashboardRelatorioUseCase = UseCase<
  DashboardRelatorioParam,
  DashboardRelatorio
>;
export default IDashboardRelatorioUseCase;
