import UseCase from '@/core/types/use_case';
import FiltroObrasDto from '@/modules/relatorios/dtos/filtro_obras.dto';
import { FormatoExportacaoLista } from '@/modules/relatorios/domain/enums/relatorios.enum';
import { RelatorioArquivo } from '@/modules/relatorios/domain/relatorios/relatorios_read_models';

export type ExportarListaObrasRelatorioParam = FiltroObrasDto & {
  usuarioId: string;
  formato: FormatoExportacaoLista;
};

type IExportarListaObrasRelatorioUseCase = UseCase<
  ExportarListaObrasRelatorioParam,
  RelatorioArquivo
>;
export default IExportarListaObrasRelatorioUseCase;
