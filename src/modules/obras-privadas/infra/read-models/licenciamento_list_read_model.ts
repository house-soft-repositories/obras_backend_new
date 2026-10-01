export interface LicenciamentoListReadModel {
  obraPrivadaId: string;
  obraCodigo: string;
  obraEndereco: string;
  proprietarioNome: string;
  situacaoAlvara: string;
  habiteSe: string | null;
  alvaraNumero: string | null;
  alvaraTipo: string | null;
  alvaraDataValidade: string | null;
  diasAteVencimento: number | null;
}
