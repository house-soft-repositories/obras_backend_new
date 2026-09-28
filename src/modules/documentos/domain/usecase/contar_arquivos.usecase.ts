import type UseCase from '@/core/types/use_case';

export interface ContarArquivosParam {
  obraId: string;
}

type IContarArquivosUseCase = UseCase<ContarArquivosParam, number>;
export default IContarArquivosUseCase;
