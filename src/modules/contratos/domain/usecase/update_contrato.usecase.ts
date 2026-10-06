import type UseCase from '@/core/types/use_case';
import ContratoEntity from '@/modules/contratos/domain/entities/contrato.entity';
import { TipoPrazoExecucao } from '@/modules/contratos/domain/enums/contratos.enums';

export interface UpdateContratoParam {
  id: string;
  empresaContratadaId?: string;
  numero?: string;
  objeto?: string | null;
  dataAssinatura?: string | null;
  fimVigencia?: string | null;
  dataOs?: string;
  tipoPrazoExecucao?: TipoPrazoExecucao;
  prazoExecucaoDias?: number | null;
  prazoExecucaoData?: string | null;
  fontes?: { fonteId: string; valor: string }[];
}

type IUpdateContratoUseCase = UseCase<UpdateContratoParam, ContratoEntity>;

export default IUpdateContratoUseCase;
