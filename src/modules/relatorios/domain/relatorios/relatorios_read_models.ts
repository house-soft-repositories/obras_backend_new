import { StatusObra } from '@/modules/obras/domain/enums/status_obra.enum';
import { TipoObra } from '@/modules/obras/domain/enums/tipo_obra.enum';
import LinhaObraRelatorioEntity from '@/modules/relatorios/domain/entities/linha_obra_relatorio.entity';
import { SemaforoDesempenho } from '@/modules/relatorios/domain/enums/relatorios.enum';

export type LocalizacaoObraRelatorio = {
  localidade: string;
  uf: string;
  latitude: number | null;
  longitude: number | null;
};

export type LinhaObraRelatorio = {
  obraId: string;
  codigo: string;
  nome: string;
  statusObra: StatusObra | string;
  tipo: TipoObra | string;
  estagioAtualId: string | null;
  estagioAtualNome: string | null;
  prazoConclusaoEstagio: string | null;
  percentualRealizado: number;
  percentualPrevisto: number;
  percentualFinanceiro: number;
  semaforo: SemaforoDesempenho | null;
  prazoVencido: boolean;
  orgaoId: string | null;
  orgaoNome: string | null;
  setorId: string | null;
  localidadeId: string | null;
  localidadeNome: string | null;
  responsavelUsuarioId: string | null;
  responsavelNome: string | null;
  tagIds: string[];
  tags: string[];
  acaoConveniada: string | null;
  eixoId: string | null;
  tipologiaId: string | null;
  classificacaoId: string | null;
  prioritaria: boolean;
  empresaExecutora: string | null;
  numeroContrato: string | null;
  localizacoes: LocalizacaoObraRelatorio[];
  dataCriacao: string;
  ultimaAtualizacao: string | null;
};

export type ItemListaObrasRelatorio = {
  obraId: string;
  codigo: string;
  nome: string;
  statusObra: string;
  tipo: string;
  estagioAtualNome: string | null;
  prazoConclusaoEstagio: string | null;
  percentualRealizado: number;
  percentualFinanceiro: number;
  semaforo: SemaforoDesempenho | null;
  orgaoId: string | null;
  orgaoNome: string | null;
  localidadeNome: string | null;
  responsavelNome: string | null;
  tags: string[];
  acaoConveniada: string | null;
  prioritaria: boolean;
  empresaExecutora: string | null;
  numeroContrato: string | null;
  localizacoes: LocalizacaoObraRelatorio[];
  dataCriacao: string;
  ultimaAtualizacao: string | null;
};

export type ListaObrasRelatorio = {
  itens: ItemListaObrasRelatorio[];
  total: number;
};

export type QuantificadoresObrasRelatorio = {
  orgaoId: string | null;
  acimaMeta: number;
  prazoVencido: number;
  abaixoMeta: number;
  semStatus: number;
  totalObras: number;
  dataReferencia: string;
};

export type DesempenhoObraRelatorio = {
  obraId: string;
  orgaoId: string | null;
  statusObra: string;
  estagioAtualId: string | null;
  prazoConclusao: string | null;
  percentualPrevisto: number;
  percentualRealizado: number;
  semaforo: SemaforoDesempenho | null;
  prazoVencido: boolean;
  dataReferencia: string;
};

export type ValoresFluxo = {
  contratadoInicial: number;
  aditivadoTotal: number;
  medidoTotal: number;
  empenhadoTotal: number;
  liquidadoTotal: number;
  pagoTotal: number;
};

export type FluxoFisicoFinanceiroRelatorio = {
  obraId: string | null;
  orgaoId: string | null;
  contratadoInicial: string;
  aditivadoTotal: string;
  totalContratado: string;
  medidoTotal: string;
  empenhadoTotal: string;
  liquidadoTotal: string;
  pagoTotal: string;
  percentuaisPorIndicador: Record<string, number>;
  percentualFisico: number;
  percentualFinanceiro: number;
  dataReferencia: string;
};

export type ContagemPorStatusRelatorio = {
  total: number;
  emAberto: number;
  emDesenvolvimento: number;
  concluidas: number;
  paralisadas: number;
  canceladas: number;
};

export type ObrasPorOrgaoRelatorio = {
  orgaoId: string;
  orgaoNome: string;
  total: number;
};

export type DashboardRelatorio = {
  quantificadoresPorOrgao: QuantificadoresObrasRelatorio[];
  fluxoAgregado: FluxoFisicoFinanceiroRelatorio;
  contagemPorStatus: ContagemPorStatusRelatorio;
  obrasPorOrgao: ObrasPorOrgaoRelatorio[];
};

export type RelatorioArquivo = {
  buffer: Buffer;
  filename: string;
  contentType: string;
};

export function toItemListaObras(
  linha: LinhaObraRelatorio,
): ItemListaObrasRelatorio {
  return LinhaObraRelatorioEntity.fromData(linha).paraItemLista();
}
