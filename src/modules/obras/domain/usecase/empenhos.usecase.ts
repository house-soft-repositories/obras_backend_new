import type UseCase from '@/core/types/use_case';
import EmpenhoEntity from '@/modules/obras/domain/entities/empenho.entity';
import type { CreateEmpenhoProps, EmpenhoProps } from '@/modules/obras/domain/entities/empenho.entity';
import type { FonteResumo } from '@/modules/obras/domain/usecase/fonte_resumo';

export interface CreateEmpenhoParam extends Omit<CreateEmpenhoProps, 'tenantId'> {
  obraId: string;
}

export interface UpdateEmpenhoParam {
  id: string;
  obraId: string;
  patch: Partial<Pick<EmpenhoProps, 'fonteId' | 'tipo' | 'numero' | 'dataEmpenho' | 'valor' | 'observacoes'>>;
}

export type ICreateEmpenhoUseCase = UseCase<CreateEmpenhoParam, EmpenhoEntity>;
export type IListEmpenhosUseCase = UseCase<string, EmpenhoEntity[]>;

export type EmpenhoComFonte = EmpenhoProps & {
  fonte: FonteResumo | null;
};
