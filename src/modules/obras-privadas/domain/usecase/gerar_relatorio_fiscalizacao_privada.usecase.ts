import UseCase from '@/core/types/use_case';
import { RelatorioArquivo } from '@/modules/obras-privadas/domain/usecase/gerar_relatorio_lista_obras_privadas.usecase';

export type GerarRelatorioFiscalizacaoPrivadaParam = {
  fiscalizacaoId: string;
};

type IGerarRelatorioFiscalizacaoPrivadaUseCase = UseCase<
  GerarRelatorioFiscalizacaoPrivadaParam,
  RelatorioArquivo
>;
export default IGerarRelatorioFiscalizacaoPrivadaUseCase;
