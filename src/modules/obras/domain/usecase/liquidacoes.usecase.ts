import type UseCase from '@/core/types/use_case';
import LiquidacaoEntity from '@/modules/obras/domain/entities/liquidacao.entity';
import type { CreateLiquidacaoProps, LiquidacaoProps } from '@/modules/obras/domain/entities/liquidacao.entity';
import type { FonteResumo } from '@/modules/obras/domain/usecase/fonte_resumo';

export interface CreateLiquidacaoParam extends Omit<CreateLiquidacaoProps, 'tenantId'> {
  obraId: string;
}

export interface UpdateLiquidacaoParam {
  id: string;
  obraId: string;
  patch: Partial<Pick<LiquidacaoProps, 'fonteId' | 'numero' | 'dataLiquidacao' | 'valor' | 'observacoes'>>;
}

export type ICreateLiquidacaoUseCase = UseCase<CreateLiquidacaoParam, LiquidacaoEntity>;
export type IListLiquidacoesUseCase = UseCase<string, LiquidacaoEntity[]>;

export type LiquidacaoComFonte = LiquidacaoProps & {
  fonte: FonteResumo | null;
};
