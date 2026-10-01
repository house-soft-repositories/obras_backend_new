import {
  SituacaoAlvara,
  SituacaoRegistroAlvara,
} from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';

/** Projecao minima de alvara necessaria para as regras deste arquivo. */
export interface AlvaraResumo {
  id: string;
  situacao: SituacaoRegistroAlvara;
  dataEmissao: string | null;
  dataValidade: string | null;
}

/** Data de hoje em ISO (YYYY-MM-DD), sem componente de fuso. */
export function hojeIso(agora: Date = new Date()): string {
  return agora.toISOString().slice(0, 10);
}

/**
 * Alvara vigente da obra: entre os registros com `situacao = VIGENTE`, o de
 * maior `dataEmissao`. Registros SUBSTITUIDO, VENCIDO e INDEFERIDO nunca
 * concorrem — em especial o INDEFERIDO, que documenta um pedido negado
 * (RN-PRV-05).
 */
export function alvaraVigente(alvaras: AlvaraResumo[]): AlvaraResumo | null {
  const candidatos = alvaras.filter(
    (a) => a.situacao === SituacaoRegistroAlvara.VIGENTE,
  );
  if (candidatos.length === 0) return null;
  return candidatos.reduce((maior, atual) =>
    (atual.dataEmissao ?? '') > (maior.dataEmissao ?? '') ? atual : maior,
  );
}

/**
 * Situacao de alvara da obra a partir dos registros.
 *
 * `DISPENSADA` e a unica marcacao manual e por isso e preservada: se o operador
 * declarou que a obra dispensa alvara (muro, pequena reforma), nenhuma
 * derivacao deve sobrescrever essa decisao.
 */
export function derivarSituacaoAlvara(
  alvaras: AlvaraResumo[],
  situacaoAtual: SituacaoAlvara,
  hoje: string = hojeIso(),
): SituacaoAlvara {
  if (situacaoAtual === SituacaoAlvara.DISPENSADA) {
    return SituacaoAlvara.DISPENSADA;
  }
  const vigente = alvaraVigente(alvaras);
  if (!vigente) return SituacaoAlvara.SEM_ALVARA;
  if (vigente.dataValidade && vigente.dataValidade < hoje) {
    return SituacaoAlvara.COM_ALVARA_VENCIDO;
  }
  return SituacaoAlvara.COM_ALVARA_VIGENTE;
}

/** Dias restantes ate o vencimento; negativo quando ja venceu. Null sem data. */
export function diasAteVencimento(
  dataValidade: string | null,
  hoje: string = hojeIso(),
): number | null {
  if (!dataValidade) return null;
  const MS_DIA = 86_400_000;
  const fim = Date.parse(`${dataValidade}T00:00:00Z`);
  const inicio = Date.parse(`${hoje}T00:00:00Z`);
  if (Number.isNaN(fim) || Number.isNaN(inicio)) return null;
  return Math.round((fim - inicio) / MS_DIA);
}

/**
 * Motivos que encadeiam um alvara ao anterior e exigem `alvaraAnteriorId`
 * (RN-PRV-04). `ORIGINAL` e o unico que nasce sem antecessor.
 */
export const MOTIVOS_QUE_EXIGEM_ANTERIOR = [
  'REVALIDACAO',
  'PRORROGACAO',
  'SEGUNDA_VIA',
] as const;
