import type UseCase from '@/core/types/use_case';
import AditivoEntity from '@/modules/contratos/domain/entities/aditivo.entity';
import {
  TipoAditivo,
  TipoPrazoExecucao,
} from '@/modules/contratos/domain/enums/contratos.enums';

export interface UpdateAditivoParam {
  id: string;
  numero?: string;
  tipo?: TipoAditivo;
  dataAssinatura?: string | null;
  tipoPrazoExecucao?: TipoPrazoExecucao | null;
  prazoExecucaoDias?: number | null;
  prazoExecucaoData?: string | null;
  vigenciaAditivada?: string | null;
  observacoes?: string | null;
  fontes?: { fonteId: string; valor: string }[];
}

type IUpdateAditivoUseCase = UseCase<UpdateAditivoParam, AditivoEntity>;
export default IUpdateAditivoUseCase;
