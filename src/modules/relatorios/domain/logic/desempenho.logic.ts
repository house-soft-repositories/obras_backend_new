import { StatusObra } from '@/modules/obras/domain/enums/status_obra.enum';
import { SemaforoDesempenho } from '@/modules/relatorios/domain/enums/relatorios.enum';

export function classificarSemaforo(
  previsto: number,
  realizado: number,
  tolerancia = 0,
): SemaforoDesempenho {
  const diff = realizado - previsto;
  if (diff > tolerancia) return SemaforoDesempenho.VERDE;
  if (diff < -tolerancia) return SemaforoDesempenho.VERMELHO;
  return SemaforoDesempenho.LARANJA;
}

export type EstagioRaizDesempenho = {
  percentualRealizado: number;
  metaAtual: number | null;
};

export type EntradaDesempenho = {
  status: StatusObra | string;
  prazoConclusao?: string | null;
  dataReferencia: string;
  estagiosRaiz: EstagioRaizDesempenho[];
  tolerancia?: number;
};

export type ResultadoDesempenho = {
  percentualPrevisto: number;
  percentualRealizado: number;
  semaforo: SemaforoDesempenho | null;
  prazoVencido: boolean;
};

function media(valores: number[]): number {
  if (!valores.length) return 0;
  return Number(
    (valores.reduce((soma, valor) => soma + valor, 0) / valores.length).toFixed(
      2,
    ),
  );
}

export function computarDesempenhoObra(
  entrada: EntradaDesempenho,
): ResultadoDesempenho {
  const realizado = media(
    entrada.estagiosRaiz.map((estagio) => estagio.percentualRealizado),
  );
  const metas = entrada.estagiosRaiz
    .map((estagio) => estagio.metaAtual)
    .filter((meta): meta is number => meta !== null);
  const previsto = metas.length ? media(metas) : realizado;
  const status = String(entrada.status);
  const prazoVencido =
    entrada.prazoConclusao !== null &&
    entrada.prazoConclusao !== undefined &&
    status !== String(StatusObra.CONCLUIDO) &&
    entrada.dataReferencia > entrada.prazoConclusao;
  const semaforo =
    status === String(StatusObra.EM_DESENVOLVIMENTO)
      ? classificarSemaforo(previsto, realizado, entrada.tolerancia ?? 0)
      : null;
  return {
    percentualPrevisto: previsto,
    percentualRealizado: realizado,
    semaforo,
    prazoVencido,
  };
}

export type BucketQuantificador =
  'acimaMeta' | 'prazoVencido' | 'abaixoMeta' | 'semStatus';

export function classificarQuantificador(
  status: StatusObra | string,
  desempenho: ResultadoDesempenho,
): BucketQuantificador {
  if (String(status) !== String(StatusObra.EM_DESENVOLVIMENTO))
    return 'semStatus';
  if (desempenho.prazoVencido) return 'prazoVencido';
  if (desempenho.semaforo === SemaforoDesempenho.VERMELHO) return 'abaixoMeta';
  return 'acimaMeta';
}

export type ObraDesempenho = {
  status: StatusObra | string;
  desempenho: ResultadoDesempenho;
};

export function agregarQuantificadores(obras: ObraDesempenho[]): {
  acimaMeta: number;
  prazoVencido: number;
  abaixoMeta: number;
  semStatus: number;
  totalObras: number;
} {
  const acc = { acimaMeta: 0, prazoVencido: 0, abaixoMeta: 0, semStatus: 0 };
  for (const obra of obras) {
    acc[classificarQuantificador(obra.status, obra.desempenho)] += 1;
  }
  return { ...acc, totalObras: obras.length };
}
