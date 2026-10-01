export interface AutoGlobalReadModel {
  id: string;
  numero: string;
  tipo: string;
  situacao: string;
  dataEmissao: string;
  prazoDias: number | null;
  dataLimite: string | null;
  valorMulta: string | null;
  obraPrivadaId: string;
  obraCodigo: string;
  obraEndereco: string;
}
