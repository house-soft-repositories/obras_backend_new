import type UseCase from '@/core/types/use_case';
import ContratoEntity from '@/modules/contratos/domain/entities/contrato.entity';
import { TipoPrazoExecucao } from '@/modules/contratos/domain/enums/contratos.enums';

export interface CreateContratoParam {
  obraId: string;
  empresaContratadaId: string;
  numero: string;
  dataOs: string;
  tipoPrazoExecucao: TipoPrazoExecucao;
  prazoExecucaoDias?: number | null;
  prazoExecucaoData?: string | null;
  objeto?: string | null;
  dataAssinatura?: string | null;
  fimVigencia?: string | null;
  fontes: { fonteId: string; valor: string }[];
}

type ICreateContratoUseCase = UseCase<CreateContratoParam, ContratoEntity>;

export default ICreateContratoUseCase;
