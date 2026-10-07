import UseCase from '@/core/types/use_case';
import FiltroObrasDto from '@/modules/relatorios/dtos/filtro_obras.dto';
import { FluxoFisicoFinanceiroRelatorio } from '@/modules/relatorios/domain/relatorios/relatorios_read_models';

export type FluxoFisicoFinanceiroRelatorioParam = FiltroObrasDto & {
  usuarioId: string;
  obraId?: string;
  orgaoId?: string;
};

type IFluxoFisicoFinanceiroRelatorioUseCase = UseCase<
  FluxoFisicoFinanceiroRelatorioParam,
  FluxoFisicoFinanceiroRelatorio
>;
export default IFluxoFisicoFinanceiroRelatorioUseCase;
