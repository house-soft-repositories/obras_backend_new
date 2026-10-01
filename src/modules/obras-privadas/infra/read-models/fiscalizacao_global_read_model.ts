export interface FiscalizacaoGlobalReadModel {
  id: string;
  numero: string;
  tipo: string;
  resultado: string;
  dataFiscalizacao: string;
  fiscalUsuarioId: string;
  etapaConstatada: string | null;
  obraPrivadaId: string;
  obraCodigo: string;
  obraEndereco: string;
}
