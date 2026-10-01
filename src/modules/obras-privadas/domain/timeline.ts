import {
  EtapaObraPrivada,
  ResultadoFiscalizacao,
  SituacaoRegistroAlvara,
  TipoAutoInfracao,
  TipoEventoTimeline,
} from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';

/** Evento ja normalizado para exibicao. */
export interface EventoTimeline {
  tipo: TipoEventoTimeline;
  /** ISO 8601; ordena a linha do tempo (mais recente primeiro). */
  data: string;
  titulo: string;
  autorUsuarioId: string | null;
  resumo: string;
  /** Id do registro de origem, para o link "ver ...". */
  registroId: string;
}

export interface EntradaTimeline {
  alvaras: {
    id: string;
    numero: string | null;
    ano: number;
    motivo: string;
    situacao: SituacaoRegistroAlvara;
    dataEmissao: string | null;
    criadoEm: Date;
  }[];
  fiscalizacoes: {
    id: string;
    numero: string;
    tipo: string;
    resultado: ResultadoFiscalizacao;
    etapaConstatada: EtapaObraPrivada | null;
    dataFiscalizacao: string;
    fiscalUsuarioId: string;
  }[];
  autos: {
    id: string;
    numero: string;
    tipo: TipoAutoInfracao;
    dataEmissao: string;
    descricao: string;
    lavradoPorUsuarioId: string;
  }[];
  habiteSe: {
    id: string;
    numero: string;
    resultado: string;
    parcial: boolean;
    dataEmissao: string | null;
    criadoEm: Date;
    vistoriadorUsuarioId: string | null;
  }[];
  observacoes: {
    id: string;
    texto: string;
    autorUsuarioId: string;
    criadoEm: Date;
  }[];
}

/** Converte data ISO curta (YYYY-MM-DD) em ISO completo, para ordenar junto. */
function comoIso(data: string | null, fallback: Date): string {
  return data ? `${data}T00:00:00.000Z` : fallback.toISOString();
}

/**
 * Monta a linha do tempo unificada, mais recente primeiro. Empate de data e
 * desempatado pelo tipo (auto antes de fiscalizacao) para que a consequencia
 * apareca acima da causa quando ambas caem no mesmo dia.
 */
export function montarTimeline(entrada: EntradaTimeline): EventoTimeline[] {
  const eventos: EventoTimeline[] = [];

  for (const a of entrada.alvaras) {
    const rotulo = a.numero ? `no ${a.numero}/${a.ano}` : `${a.ano}`;
    const indeferido = a.situacao === SituacaoRegistroAlvara.INDEFERIDO;
    eventos.push({
      tipo: TipoEventoTimeline.ALVARA,
      data: comoIso(a.dataEmissao, a.criadoEm),
      titulo: indeferido
        ? `Pedido de alvara indeferido — ${rotulo}`
        : `Alvara registrado — ${rotulo}`,
      autorUsuarioId: null,
      resumo: `Motivo: ${a.motivo}. Situacao: ${a.situacao}.`,
      registroId: a.id,
    });
  }

  for (const f of entrada.fiscalizacoes) {
    const irregular = f.resultado === ResultadoFiscalizacao.IRREGULAR;
    eventos.push({
      tipo: irregular
        ? TipoEventoTimeline.FISCALIZACAO_IRREGULAR
        : TipoEventoTimeline.FISCALIZACAO,
      data: comoIso(f.dataFiscalizacao, new Date(0)),
      titulo: `Fiscalizacao ${f.tipo} — ${f.numero}`,
      autorUsuarioId: f.fiscalUsuarioId,
      resumo: f.etapaConstatada
        ? `Resultado: ${f.resultado}. Etapa constatada: ${f.etapaConstatada}.`
        : `Resultado: ${f.resultado}.`,
      registroId: f.id,
    });
  }

  for (const a of entrada.autos) {
    const embargo =
      a.tipo === TipoAutoInfracao.EMBARGO ||
      a.tipo === TipoAutoInfracao.INTERDICAO;
    eventos.push({
      tipo: embargo ? TipoEventoTimeline.EMBARGO : TipoEventoTimeline.AUTO,
      data: comoIso(a.dataEmissao, new Date(0)),
      titulo: `${a.tipo} — ${a.numero}`,
      autorUsuarioId: a.lavradoPorUsuarioId,
      resumo: a.descricao,
      registroId: a.id,
    });
  }

  for (const h of entrada.habiteSe) {
    eventos.push({
      tipo: TipoEventoTimeline.HABITE_SE,
      data: comoIso(h.dataEmissao, h.criadoEm),
      titulo: `Habite-se ${h.parcial ? 'parcial ' : ''}${h.resultado} — ${h.numero}`,
      autorUsuarioId: h.vistoriadorUsuarioId,
      resumo: `Resultado da vistoria: ${h.resultado}.`,
      registroId: h.id,
    });
  }

  for (const o of entrada.observacoes) {
    eventos.push({
      tipo: TipoEventoTimeline.OBSERVACAO,
      data: o.criadoEm.toISOString(),
      titulo: 'Observacao',
      autorUsuarioId: o.autorUsuarioId,
      resumo: o.texto,
      registroId: o.id,
    });
  }

  const PESO: Record<TipoEventoTimeline, number> = {
    [TipoEventoTimeline.EMBARGO]: 0,
    [TipoEventoTimeline.AUTO]: 1,
    [TipoEventoTimeline.HABITE_SE]: 2,
    [TipoEventoTimeline.ALVARA]: 3,
    [TipoEventoTimeline.FISCALIZACAO_IRREGULAR]: 4,
    [TipoEventoTimeline.FISCALIZACAO]: 5,
    [TipoEventoTimeline.OBSERVACAO]: 6,
  };

  return eventos.sort((a, b) =>
    a.data === b.data
      ? PESO[a.tipo] - PESO[b.tipo]
      : a.data < b.data
        ? 1
        : -1,
  );
}

/** Ordem canonica das etapas no stepper da aba Acompanhamento. */
export const ORDEM_ETAPAS: EtapaObraPrivada[] = [
  EtapaObraPrivada.NAO_INICIADA,
  EtapaObraPrivada.FUNDACAO,
  EtapaObraPrivada.ESTRUTURA,
  EtapaObraPrivada.ALVENARIA,
  EtapaObraPrivada.COBERTURA,
  EtapaObraPrivada.INSTALACOES,
  EtapaObraPrivada.ACABAMENTO,
  EtapaObraPrivada.CONCLUIDA,
];

export interface EtapaComData {
  etapa: EtapaObraPrivada;
  /** Data da PRIMEIRA visita que constatou a etapa; null se nunca constatada. */
  data: string | null;
  concluida: boolean;
  atual: boolean;
}

/** Visita reduzida ao que o stepper precisa. */
export interface VisitaEtapa {
  dataFiscalizacao: string;
  etapaConstatada: EtapaObraPrivada | null;
}

/**
 * Stepper de etapas. A etapa ATUAL e a da visita mais recente (por data), nao a
 * mais avancada ja vista — uma obra pode regredir de etapa numa demolicao
 * parcial, e o stepper deve refletir o ultimo fato observado.
 *
 * A data de cada etapa e a da PRIMEIRA visita que a constatou: e quando a obra
 * chegou naquele estagio, nao quando o fiscal voltou a confirmar.
 */
export function montarEtapas(visitas: VisitaEtapa[]): EtapaComData[] {
  const comEtapa = visitas.filter((v) => v.etapaConstatada !== null);

  const primeiraData = new Map<EtapaObraPrivada, string>();
  for (const v of comEtapa) {
    const etapa = v.etapaConstatada as EtapaObraPrivada;
    const atual = primeiraData.get(etapa);
    if (!atual || v.dataFiscalizacao < atual) {
      primeiraData.set(etapa, v.dataFiscalizacao);
    }
  }

  const maisRecente = comEtapa.reduce<VisitaEtapa | null>(
    (maior, v) =>
      !maior || v.dataFiscalizacao > maior.dataFiscalizacao ? v : maior,
    null,
  );
  const indiceAtual = maisRecente
    ? ORDEM_ETAPAS.indexOf(maisRecente.etapaConstatada as EtapaObraPrivada)
    : -1;

  return ORDEM_ETAPAS.map((etapa, i) => ({
    etapa,
    data: primeiraData.get(etapa) ?? null,
    concluida: indiceAtual >= 0 && i < indiceAtual,
    atual: i === indiceAtual,
  }));
}
