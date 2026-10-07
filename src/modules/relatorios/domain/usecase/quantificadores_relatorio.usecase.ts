import UseCase from '@/core/types/use_case';
import FiltroObrasDto from '@/modules/relatorios/dtos/filtro_obras.dto';
import { QuantificadoresObrasRelatorio } from '@/modules/relatorios/domain/relatorios/relatorios_read_models';

export type QuantificadoresRelatorioParam = FiltroObrasDto & {
  usuarioId: string;
};

type IQuantificadoresRelatorioUseCase = UseCase<
  QuantificadoresRelatorioParam,
  QuantificadoresObrasRelatorio
>;
export default IQuantificadoresRelatorioUseCase;
