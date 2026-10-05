import type UseCase from '@/core/types/use_case';
import PagamentoEntity from '@/modules/obras/domain/entities/pagamento.entity';
import type { CreatePagamentoProps, PagamentoProps } from '@/modules/obras/domain/entities/pagamento.entity';
import type { FonteResumo } from '@/modules/obras/domain/usecase/fonte_resumo';

export interface CreatePagamentoParam extends Omit<CreatePagamentoProps, 'tenantId'> {
  obraId: string;
}

export interface UpdatePagamentoParam {
  id: string;
  obraId: string;
  patch: Partial<Pick<PagamentoProps, 'fonteId' | 'numeroOrdemBancaria' | 'dataOrdemBancaria' | 'valor' | 'observacoes'>>;
}

export interface PagamentoResult {
  pagamento: PagamentoEntity;
  alerta?: string;
}

export type PagamentoComFonte = PagamentoProps & {
  fonte: FonteResumo | null;
};

export interface PagamentoComFonteResult {
  pagamento: PagamentoComFonte;
  alerta?: string;
}

export type ICreatePagamentoUseCase = UseCase<CreatePagamentoParam, PagamentoResult>;
export type IListPagamentosUseCase = UseCase<string, PagamentoEntity[]>;
