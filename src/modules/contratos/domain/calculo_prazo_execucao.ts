/**
 * Servico PURO (sem repositorio, sem I/O) da regra-ouro do prazo final de
 * execucao (RN-CON-01). Recebe os dados ja carregados do Contrato, suas
 * paralisacoes e aditivos, as flags considerar_sabado/considerar_domingo da
 * Obra (RN-CON-02) e a data de referencia, e devolve o prazo final calculado.
 *
 * Convencao de contagem (coerente com calculo-datas do CronogramaContext e com
 * o exemplo do manual 10.1.1):
 * - `data_os` e o dia ZERO da contagem (nao consome dias).
 * - Avancar `total_dias` significa caminhar para frente a partir de data_os ate
 *   acumular `total_dias` dias *contados*.
 * - Um dia conta, exceto se for sabado e !considerarSabado, ou domingo e
 *   !considerarDomingo (RN-CON-02). Dias nao contados sao pulados, empurrando o
 *   prazo final adiante.
 *
 * Datas sao strings 'YYYY-MM-DD'; a aritmetica usa UTC para evitar efeitos de
 * fuso horario.
 */

import {
  TipoAditivo,
  TipoPrazoExecucao,
} from '@/modules/contratos/domain/enums/contratos.enums';

export interface ParalisacaoCalculo {
  /** Inicio da paralisacao (necessario quando dias_parados nao foi informado). */
  dataParalisacao: string;
  /** Dias parados informados ou ja derivados; null = paralisacao aberta. */
  diasParados: number | null;
  /** Data de reinicio, quando informada. */
  dataReinicio: string | null;
}

export interface AditivoCalculo {
  tipo: TipoAditivo;
  /** Forma do prazo de execucao aditivado (PRAZO / PRAZO_E_VALOR). */
  tipoPrazoExecucao: TipoPrazoExecucao | null;
  /** Dias de execucao aditivados, quando informado em dias. */
  prazoExecucaoDias: number | null;
  /** Data alvo de execucao aditivada, quando informado como data (RN-CON-05). */
  prazoExecucaoData: string | null;
  /**
   * Ordem de lancamento. Aditivos de prazo informados como DATA sao convertidos
   * contra o prazo final vigente NO MOMENTO do lancamento (RN-CON-05), entao a
   * ordem importa. Quando ausente, mantem a ordem do array.
   */
  ordem?: number;
}

export interface EntradaCalculoPrazo {
  dataOs: string;
  tipoPrazoExecucao: TipoPrazoExecucao;
  prazoExecucaoDias: number | null;
  prazoExecucaoData: string | null;
  paralisacoes: ParalisacaoCalculo[];
  aditivos: AditivoCalculo[];
  considerarSabado: boolean;
  considerarDomingo: boolean;
  /** Data corrente para projetar paralisacao aberta (RN-CON-12). */
  dataReferencia: string;
}

export interface ResultadoCalculoPrazo {
  /** Dias base derivados do prazo de execucao do contrato (RN-CON-03). */
  diasBase: number;
  /** Soma dos dias parados de todas as paralisacoes (RN-CON-11/12). */
  diasParalisacoes: number;
  /** Soma dos dias de execucao dos aditivos de prazo (RN-CON-06). */
  diasAditivos: number;
  /** diasBase + diasParalisacoes + diasAditivos. */
  totalDias: number;
  /** Data final calculada 'YYYY-MM-DD' (RN-CON-01). */
  prazoFinal: string;
}

function parse(data: string): Date {
  const [ano, mes, dia] = data.split('-').map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia));
}

function formatar(d: Date): string {
  const ano = d.getUTCFullYear().toString().padStart(4, '0');
  const mes = (d.getUTCMonth() + 1).toString().padStart(2, '0');
  const dia = d.getUTCDate().toString().padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function adicionarDias(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 86_400_000);
}

/** Diferenca em dias corridos entre duas datas (b - a). */
function diffDiasCorridos(a: string, b: string): number {
  return Math.round((parse(b).getTime() - parse(a).getTime()) / 86_400_000);
}

/** Indica se o dia conta dado as flags de sabado/domingo. 0=domingo, 6=sabado. */
function diaConta(
  d: Date,
  considerarSabado: boolean,
  considerarDomingo: boolean,
): boolean {
  const dow = d.getUTCDay();
  if (dow === 6 && !considerarSabado) return false;
  if (dow === 0 && !considerarDomingo) return false;
  return true;
}

/**
 * Avanca `totalDias` dias contados a partir de `dataInicio` (dia zero, nao
 * contado), pulando sabados/domingos quando as flags estiverem desmarcadas.
 * Retorna a data alcancada. Se totalDias <= 0, retorna a propria dataInicio.
 */
export function avancarDiasContados(
  dataInicio: string,
  totalDias: number,
  considerarSabado: boolean,
  considerarDomingo: boolean,
): string {
  if (totalDias <= 0) return dataInicio;
  let cursor = parse(dataInicio);
  let contados = 0;
  for (;;) {
    cursor = adicionarDias(cursor, 1);
    if (diaConta(cursor, considerarSabado, considerarDomingo)) {
      contados += 1;
      if (contados === totalDias) return formatar(cursor);
    }
  }
}

/**
 * Conta os dias contados no intervalo (inicio, fim] — exclusivo no inicio (dia
 * zero) e inclusivo no fim, espelhando avancarDiasContados. Inverso de
 * avancarDiasContados. Retorna 0 se fim <= inicio.
 */
export function contarDiasContados(
  inicio: string,
  fim: string,
  considerarSabado: boolean,
  considerarDomingo: boolean,
): number {
  const di = parse(inicio);
  const df = parse(fim);
  if (df.getTime() <= di.getTime()) return 0;
  let contados = 0;
  let cursor = di;
  while (cursor.getTime() < df.getTime()) {
    cursor = adicionarDias(cursor, 1);
    if (diaConta(cursor, considerarSabado, considerarDomingo)) contados += 1;
  }
  return contados;
}

/**
 * Calcula o prazo final de execucao (RN-CON-01). Etapas:
 * 1. dias_base: prazo_execucao_dias; se DATA, derivado como dias corridos
 *    entre data_os e prazo_execucao_data (RN-CON-03).
 * 2. dias_paralisacoes: soma de dias_parados; paralisacao aberta projeta ate a
 *    data de referencia (RN-CON-11/12).
 * 3. dias_aditivos: soma dos dias de execucao dos aditivos PRAZO/PRAZO_E_VALOR
 *    (RN-CON-06); aditivo como DATA convertido contra o prazo vigente no
 *    lancamento (RN-CON-05).
 * 4. prazo_final: avancar total_dias a partir de data_os, pulando sabados/
 *    domingos conforme as flags (RN-CON-02).
 */
export function calcularPrazoFinalExecucao(
  e: EntradaCalculoPrazo,
): ResultadoCalculoPrazo {
  // 1. dias_base (RN-CON-03).
  let diasBase: number;
  if (e.tipoPrazoExecucao === TipoPrazoExecucao.DATA) {
    if (!e.prazoExecucaoData) {
      throw new Error('prazo_execucao_data e obrigatorio quando tipo = DATA');
    }
    diasBase = diffDiasCorridos(e.dataOs, e.prazoExecucaoData);
  } else {
    if (e.prazoExecucaoDias == null) {
      throw new Error('prazo_execucao_dias e obrigatorio quando tipo = DIAS');
    }
    diasBase = e.prazoExecucaoDias;
  }

  // 2. dias_paralisacoes (RN-CON-11/12).
  let diasParalisacoes = 0;
  for (const p of e.paralisacoes) {
    if (p.diasParados != null) {
      diasParalisacoes += p.diasParados;
    } else if (p.dataReinicio) {
      diasParalisacoes += diffDiasCorridos(p.dataParalisacao, p.dataReinicio);
    } else {
      // Paralisacao aberta: projeta ate a data de referencia (RN-CON-12).
      diasParalisacoes += Math.max(
        0,
        diffDiasCorridos(p.dataParalisacao, e.dataReferencia),
      );
    }
  }

  // 3. dias_aditivos (RN-CON-06), na ordem de lancamento (RN-CON-05).
  const aditivosPrazo = e.aditivos
    .filter(
      (a) =>
        a.tipo === TipoAditivo.PRAZO || a.tipo === TipoAditivo.PRAZO_E_VALOR,
    )
    .map((a, i) => ({ a, ordem: a.ordem ?? i }))
    .sort((x, y) => x.ordem - y.ordem)
    .map((x) => x.a);

  let diasAditivos = 0;
  for (const a of aditivosPrazo) {
    // Prazo final vigente ANTES deste aditivo (base + paralisacoes + aditivos
    // ja somados) usado para converter aditivo informado como DATA (RN-CON-05).
    const prazoVigente = avancarDiasContados(
      e.dataOs,
      diasBase + diasParalisacoes + diasAditivos,
      e.considerarSabado,
      e.considerarDomingo,
    );
    if (a.tipoPrazoExecucao === TipoPrazoExecucao.DATA) {
      if (!a.prazoExecucaoData) continue;
      // Dias contados entre o prazo vigente e a nova data alvo; a data de
      // assinatura do aditivo jamais entra na soma (RN-CON-05).
      diasAditivos += contarDiasContados(
        prazoVigente,
        a.prazoExecucaoData,
        e.considerarSabado,
        e.considerarDomingo,
      );
    } else if (a.prazoExecucaoDias != null) {
      diasAditivos += a.prazoExecucaoDias;
    }
  }

  const totalDias = diasBase + diasParalisacoes + diasAditivos;
  const prazoFinal = avancarDiasContados(
    e.dataOs,
    totalDias,
    e.considerarSabado,
    e.considerarDomingo,
  );

  return { diasBase, diasParalisacoes, diasAditivos, totalDias, prazoFinal };
}
