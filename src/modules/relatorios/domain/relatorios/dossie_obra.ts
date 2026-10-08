/**
 * Conteúdo do dossiê da obra pública (RN-REL-18, paridade com o legado
 * `dossie-obra.dominio.ts`): ficha, equipe, contrato, aditivos, paralisações,
 * cronograma, medições e execução financeira num único documento, com anexo
 * fotográfico. Funções PURAS — o service só renderiza o que elas decidem, o
 * que deixa o conteúdo testável sem gerar PDF.
 *
 * Escopo: obras públicas (`src/modules/relatorios`). Obras privadas têm
 * dossiê próprio em `src/modules/obras-privadas` e não passam por aqui.
 */
import type { FluxoFisicoFinanceiroRelatorio } from '@/modules/relatorios/domain/relatorios/relatorios_read_models';
import type { SecaoRelatorio } from '@/modules/relatorios/domain/relatorios/exportar_lista_obras';

/**
 * Guarda-corpos do anexo fotográfico (RN-PRV-18, mesmos do legado): sem eles,
 * um dossiê com centenas de fotos estouraria memória/tempo de renderização.
 */
export const MAX_FOTOS_DOSSIE = 40;
export const MAX_BYTES_TOTAL_DOSSIE = 25 * 1024 * 1024;

/** Formata data ISO (YYYY-MM-DD) como dd/mm/aaaa, sem passar por Date. */
export function formatarData(iso: string | Date | null | undefined): string {
  // Aceita Date pelo mesmo motivo do relatório de privadas: colunas
  // date/timestamptz podem chegar hidratadas como objeto.
  const texto =
    iso instanceof Date
      ? (Number.isNaN(iso.getTime()) ? null : iso.toISOString().slice(0, 10))
      : iso;
  if (!texto) return '—';
  const [ano, mes, dia] = texto.slice(0, 10).split('-');
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : '—';
}

/** Rótulo legível de enum: EM_ANDAMENTO -> "Em andamento". */
export function rotuloEnum(valor: string | null | undefined): string {
  if (!valor) return '—';
  const texto = valor.replace(/_/g, ' ').toLowerCase();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** CNPJ só dígitos -> 00.000.000/0000-00; devolve o original se não couber. */
export function mascararCnpj(valor: string | null | undefined): string {
  if (!valor) return '—';
  const d = valor.replace(/\D/g, '');
  if (d.length !== 14) return valor;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export function formatarMoeda(valor: string | number): string {
  return Number(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export interface DadosObraDossie {
  codigo: string;
  nome: string;
  descricao: string | null;
  tipo: string;
  status: string;
  tipoFinanciamento: string;
  acaoConveniada: string | null;
  prioritaria: boolean;
  dataInicio: string | null;
  dataPrazo: string | null;
  dataPactuada: string | null;
  orgaoNome: string | null;
  localidadeNome: string | null;
  secretario: string | null;
  programaPpa: string | null;
  acaoEstrategica: string | null;
  unidadeMedida: string | null;
  quantidade: string | null;
}

export interface DadosContratoDossie {
  numero: string;
  objeto: string | null;
  empresaRazaoSocial: string;
  empresaCnpj: string;
  dataAssinatura: string | null;
  dataOs: string;
  fimVigencia: string | null;
  tipoPrazoExecucao: string;
  prazoExecucaoDias: number | null;
  prazoExecucaoData: string | null;
  valorInicial: string;
}

export interface DadosAditivoDossie {
  numero: string;
  tipo: string;
  dataAssinatura: string | null;
  vigenciaAditivada: string | null;
  prazoExecucaoDias: number | null;
  valor: string;
}

export interface DadosParalisacaoDossie {
  dataParalisacao: string;
  motivo: string;
  dataReinicio: string | null;
  diasParados: number | null;
}

export interface DadosEquipeDossie {
  nome: string;
  tipo: string;
}

export interface DadosEstagioDossie {
  descricao: string;
  percentual: number;
  dataPrazo: string | null;
  concluido: boolean;
}

export interface DadosMedicaoDossie {
  numero: number;
  dataMedicao: string;
  tipo: string;
  valor: string;
}

export interface DadosDossieObra {
  obra: DadosObraDossie;
  equipe: DadosEquipeDossie[];
  contrato: DadosContratoDossie | null;
  aditivos: DadosAditivoDossie[];
  paralisacoes: DadosParalisacaoDossie[];
  estagios: DadosEstagioDossie[];
  medicoes: DadosMedicaoDossie[];
  fluxo: FluxoFisicoFinanceiroRelatorio;
}

/** Dossiê carregado do banco, ainda sem o fluxo (preenchido pelo service). */
export type DossieObraSemFluxo = Omit<DadosDossieObra, 'fluxo'>;

/**
 * Origem de uma foto no bucket, já com os metadados da legenda. O
 * DocumentosContext não classifica "foto" como categoria — o mime type é o
 * único marcador disponível (`mime_type LIKE 'image/%'`).
 */
export interface FotoOrigemDossie {
  id: string;
  storageKey: string;
  mimeType: string | null;
  legenda: string;
  data: string;
}

/** Foto com binário pronto para embutir no HTML (data URI). */
export interface FotoProntaDossie {
  dataUri: string;
  legenda: string;
  data: string;
}

export interface DossieObraCarregado {
  dossie: DossieObraSemFluxo;
  fotos: FotoOrigemDossie[];
}

/** Prazo de execução em uma expressão, conforme o modo do contrato. */
export function descreverPrazoExecucao(c: {
  tipoPrazoExecucao: string;
  prazoExecucaoDias: number | null;
  prazoExecucaoData: string | null;
}): string {
  if (c.prazoExecucaoDias !== null) return `${c.prazoExecucaoDias} dias`;
  if (c.prazoExecucaoData) return `até ${formatarData(c.prazoExecucaoData)}`;
  return rotuloEnum(c.tipoPrazoExecucao);
}

/** Identificação da obra — cabeçalho do dossiê. */
export function secaoIdentificacao(o: DadosObraDossie): SecaoRelatorio {
  return {
    titulo: 'Identificação',
    linhas: [
      `Código: ${o.codigo}`,
      `Nome: ${o.nome}`,
      `Tipo: ${rotuloEnum(o.tipo)}`,
      `Status: ${rotuloEnum(o.status)}${o.prioritaria ? ' — OBRA PRIORITÁRIA' : ''}`,
      `Órgão: ${o.orgaoNome ?? '—'}`,
      `Localidade: ${o.localidadeNome ?? '—'}`,
      `Secretário: ${o.secretario ?? '—'}`,
      // "NAO" é o default da coluna: imprimi-lo ao lado do financiamento
      // ("Sem OGU — Não") sugere uma negativa sobre o financiamento, não
      // sobre o convênio. Só aparece quando há convênio de fato.
      `Financiamento: ${rotuloEnum(o.tipoFinanciamento)}${
        o.acaoConveniada && o.acaoConveniada !== 'NAO'
          ? ` — convênio ${rotuloEnum(o.acaoConveniada)}`
          : ''
      }`,
      `Programa PPA: ${o.programaPpa ?? '—'}`,
      `Ação estratégica: ${o.acaoEstrategica ?? '—'}`,
      `Meta física: ${
        o.quantidade ? `${o.quantidade} ${o.unidadeMedida ?? ''}`.trim() : '—'
      }`,
      `Início: ${formatarData(o.dataInicio)} — Prazo: ${formatarData(o.dataPrazo)}`,
      `Data pactuada: ${formatarData(o.dataPactuada)}`,
      `Descrição: ${o.descricao ?? '—'}`,
    ],
  };
}

/** Seções do dossiê completo da obra pública. */
export function montarSecoesDossieObra(d: DadosDossieObra): SecaoRelatorio[] {
  return [
    secaoIdentificacao(d.obra),
    {
      titulo: 'Equipe',
      linhas: d.equipe.length
        ? d.equipe.map((e) => `${e.nome} — ${rotuloEnum(e.tipo)}`)
        : ['Nenhum responsável atribuído.'],
    },
    {
      titulo: 'Contrato',
      linhas: d.contrato
        ? [
            `Número: ${d.contrato.numero}`,
            `Contratada: ${d.contrato.empresaRazaoSocial} (${mascararCnpj(d.contrato.empresaCnpj)})`,
            `Objeto: ${d.contrato.objeto ?? '—'}`,
            `Assinatura: ${formatarData(d.contrato.dataAssinatura)} — Ordem de serviço: ${formatarData(d.contrato.dataOs)}`,
            `Fim de vigência: ${formatarData(d.contrato.fimVigencia)}`,
            `Prazo de execução: ${descreverPrazoExecucao(d.contrato)}`,
            `Valor inicial: ${formatarMoeda(d.contrato.valorInicial)}`,
          ]
        : ['OBRA SEM CONTRATO REGISTRADO.'],
    },
    {
      titulo: 'Aditivos',
      linhas: d.aditivos.length
        ? d.aditivos.map(
            (a) =>
              `${a.numero} — ${rotuloEnum(a.tipo)} — assinatura ${formatarData(a.dataAssinatura)}${
                a.prazoExecucaoDias !== null
                  ? ` — +${a.prazoExecucaoDias} dias`
                  : ''
              }${
                a.vigenciaAditivada
                  ? ` — vigência até ${formatarData(a.vigenciaAditivada)}`
                  : ''
              } — ${formatarMoeda(a.valor)}`,
          )
        : ['Nenhum aditivo registrado.'],
    },
    {
      titulo: 'Paralisações',
      linhas: d.paralisacoes.length
        ? d.paralisacoes.map(
            (p) =>
              `${formatarData(p.dataParalisacao)} — ${p.motivo} — ${
                p.dataReinicio
                  ? `reinício ${formatarData(p.dataReinicio)}${
                      p.diasParados !== null ? ` (${p.diasParados} dias)` : ''
                    }`
                  : 'EM CURSO'
              }`,
          )
        : ['Nenhuma paralisação registrada.'],
    },
    {
      titulo: 'Cronograma',
      linhas: d.estagios.length
        ? d.estagios.map(
            (e) =>
              `${e.descricao} — ${e.percentual}%${e.concluido ? ' (concluído)' : ''}${
                e.dataPrazo ? ` — prazo ${formatarData(e.dataPrazo)}` : ''
              }`,
          )
        : ['Sem estágios cadastrados.'],
    },
    {
      titulo: 'Medições',
      linhas: d.medicoes.length
        ? d.medicoes.map(
            (m) =>
              `#${m.numero} — ${rotuloEnum(m.tipo)} — ${formatarData(m.dataMedicao)} — ${formatarMoeda(m.valor)}`,
          )
        : ['Sem medições registradas.'],
    },
    {
      titulo: 'Execução financeira',
      linhas: [
        `Contratado inicial: ${formatarMoeda(d.fluxo.contratadoInicial)}`,
        `Aditivado: ${formatarMoeda(d.fluxo.aditivadoTotal)}`,
        `Total contratado: ${formatarMoeda(d.fluxo.totalContratado)}`,
        `Medido: ${formatarMoeda(d.fluxo.medidoTotal)}`,
        `Empenhado: ${formatarMoeda(d.fluxo.empenhadoTotal)}`,
        `Liquidado: ${formatarMoeda(d.fluxo.liquidadoTotal)}`,
        `Pago: ${formatarMoeda(d.fluxo.pagoTotal)} (${d.fluxo.percentualFinanceiro}%)`,
        `Percentual físico: ${d.fluxo.percentualFisico}%`,
        `Data de referência: ${formatarData(d.fluxo.dataReferencia)}`,
      ],
    },
  ];
}
