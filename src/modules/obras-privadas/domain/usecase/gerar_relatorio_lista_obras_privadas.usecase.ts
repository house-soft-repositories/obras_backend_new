import UseCase from '@/core/types/use_case';

export type FormatoRelatorioObrasPrivadas = 'CSV' | 'PDF';

export type RelatorioArquivo = {
  buffer: Buffer;
  filename: string;
  contentType: string;
};

export type GerarRelatorioListaObrasPrivadasParam = {
  busca?: string;
  situacaoAlvara?: string;
  andamento?: string;
  habiteSe?: string;
  bairro?: string;
  orgaoId?: string;
  localidadeId?: string;
  autuada?: boolean;
  embargada?: boolean;
  fiscalizada?: boolean;
  semVisitaHaDias?: number;
  formato: FormatoRelatorioObrasPrivadas;
};

type IGerarRelatorioListaObrasPrivadasUseCase = UseCase<
  GerarRelatorioListaObrasPrivadasParam,
  RelatorioArquivo
>;
export default IGerarRelatorioListaObrasPrivadasUseCase;
