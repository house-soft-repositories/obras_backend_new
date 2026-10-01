import {
  AndamentoObraPrivada,
  SituacaoAutoInfracao,
  TipoAutoInfracao,
} from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';

const MS_DIA = 86_400_000;

/** Projecao minima de auto necessaria para as regras deste arquivo. */
export interface AutoResumo {
  tipo: TipoAutoInfracao;
  situacao: SituacaoAutoInfracao;
  dataLimite: string | null;
}

/** Data limite = dataEmissao + prazoDias (dias corridos) — RN-PRV-11. */
export function calcularDataLimite(
  dataEmissao: string,
  prazoDias: number | null | undefined,
): string | null {
  if (prazoDias === null || prazoDias === undefined) return null;
  const inicio = Date.parse(`${dataEmissao}T00:00:00Z`);
  if (Number.isNaN(inicio)) return null;
  return new Date(inicio + prazoDias * MS_DIA).toISOString().slice(0, 10);
}

/** Situacoes que mantem o auto "em aberto" para efeito de obra autuada. */
const SITUACOES_PENDENTES = [
  SituacaoAutoInfracao.ABERTO,
  SituacaoAutoInfracao.EM_RECURSO,
];

/** Tipos que suspendem a execucao da obra enquanto estiverem abertos. */
const TIPOS_QUE_PARALISAM = [
  TipoAutoInfracao.EMBARGO,
  TipoAutoInfracao.INTERDICAO,
];

/** A obra tem ao menos um auto pendente (chip "Autuada"). */
export function estaAutuada(autos: AutoResumo[]): boolean {
  return autos.some((a) => SITUACOES_PENDENTES.includes(a.situacao));
}

/**
 * A obra tem embargo ou interdicao ABERTO (chip "Embargada"). Note que
 * `EM_RECURSO` NAO conta: recorrer nao suspende o embargo, mas a obra segue
 * paralisada apenas enquanto o ato estiver aberto.
 */
export function estaEmbargada(autos: AutoResumo[]): boolean {
  return autos.some(
    (a) =>
      TIPOS_QUE_PARALISAM.includes(a.tipo) &&
      a.situacao === SituacaoAutoInfracao.ABERTO,
  );
}

/**
 * Andamento resultante apos criar/alterar um auto (RN-PRV-12). Havendo embargo
 * aberto a obra e forcada a PARALISADA; ao encerrar o ultimo, ela volta a
 * EM_ANDAMENTO — mas so se estava paralisada, para nao ressuscitar obra
 * concluida, demolida ou cancelada.
 */
export function andamentoAposAuto(
  autos: AutoResumo[],
  andamentoAtual: AndamentoObraPrivada,
): AndamentoObraPrivada {
  if (estaEmbargada(autos)) return AndamentoObraPrivada.PARALISADA;
  if (andamentoAtual === AndamentoObraPrivada.PARALISADA) {
    return AndamentoObraPrivada.EM_ANDAMENTO;
  }
  return andamentoAtual;
}

/** Situacao do prazo de um auto, para o contador exibido na interface. */
export interface ContagemPrazo {
  /** Dias ate a data limite; negativo quando vencido. Null sem prazo. */
  dias: number | null;
  vencido: boolean;
  /** "faltam 11 dias" | "vencido ha 34 dias" | "no prazo" | "". */
  rotulo: string;
}

/**
 * Contagem regressiva do prazo. Auto ja CUMPRIDO ou QUITADO nunca aparece como
 * vencido: o prazo perdeu o efeito quando a obrigacao foi satisfeita.
 */
export function contarPrazo(
  auto: AutoResumo,
  hoje: string = new Date().toISOString().slice(0, 10),
): ContagemPrazo {
  const encerrado =
    auto.situacao === SituacaoAutoInfracao.CUMPRIDO ||
    auto.situacao === SituacaoAutoInfracao.QUITADO;

  if (!auto.dataLimite) {
    return { dias: null, vencido: false, rotulo: '' };
  }
  const fim = Date.parse(`${auto.dataLimite}T00:00:00Z`);
  const inicio = Date.parse(`${hoje}T00:00:00Z`);
  if (Number.isNaN(fim) || Number.isNaN(inicio)) {
    return { dias: null, vencido: false, rotulo: '' };
  }
  const dias = Math.round((fim - inicio) / MS_DIA);

  if (encerrado) return { dias, vencido: false, rotulo: 'no prazo' };
  if (dias < 0) {
    return { dias, vencido: true, rotulo: `vencido ha ${Math.abs(dias)} dias` };
  }
  return { dias, vencido: false, rotulo: `faltam ${dias} dias` };
}
