import type UseCase from '@/core/types/use_case';

export interface AddEquipeParam {
  obraId: string;
  usuarioId: string;
  tipo?: string;
}

export interface RemoveEquipeParam {
  obraId: string;
  usuarioId: string;
}

export interface ListEquipeParam {
  obraId: string;
}

type IEquipeUseCase = UseCase<AddEquipeParam, void>;
export default IEquipeUseCase;
export type IEquipeListUseCase = UseCase<ListEquipeParam, Array<{ usuarioId: string; tipo: string }>>;
export type IEquipeRemoveUseCase = UseCase<RemoveEquipeParam, void>;
