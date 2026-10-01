export interface ObraPrivadaListReadModel {
  id: string;
  codigo: string;
  logradouro: string;
  numero: string | null;
  bairro: string | null;
  uf: string;
  latitude: string | null;
  longitude: string | null;
  proprietarioNome: string;
  proprietarioDocumento: string;
  situacaoAlvara: string;
  andamento: string | null;
  habiteSe: string | null;
  etapaAtual: string | null;
  ultimaVisitaEm: string | null;
  diasSemVisita: number | null;
  fiscalizada: boolean;
  autuada: boolean;
  embargada: boolean;
}
