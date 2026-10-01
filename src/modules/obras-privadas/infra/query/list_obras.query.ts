export type ListObrasQuery = {
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
};
