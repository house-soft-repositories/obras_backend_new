import UseCase from '@/core/types/use_case';
import { RelatorioArquivo } from '@/modules/relatorios/domain/relatorios/relatorios_read_models';

export type GerarPdfObraRelatorioParam = {
  usuarioId: string;
  obraId: string;
};

type IGerarPdfObraRelatorioUseCase = UseCase<
  GerarPdfObraRelatorioParam,
  RelatorioArquivo
>;
export default IGerarPdfObraRelatorioUseCase;
