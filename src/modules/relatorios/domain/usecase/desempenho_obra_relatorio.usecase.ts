import UseCase from '@/core/types/use_case';
import { DesempenhoObraRelatorio } from '@/modules/relatorios/domain/relatorios/relatorios_read_models';

export type DesempenhoObraRelatorioParam = {
  usuarioId: string;
  obraId: string;
};

type IDesempenhoObraRelatorioUseCase = UseCase<
  DesempenhoObraRelatorioParam,
  DesempenhoObraRelatorio
>;
export default IDesempenhoObraRelatorioUseCase;
