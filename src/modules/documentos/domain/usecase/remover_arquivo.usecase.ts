import type UseCase from '@/core/types/use_case';
import type { Unit } from '@/core/types/unit';

export interface RemoverArquivoParam {
  arquivoId: string;
}

type IRemoverArquivoUseCase = UseCase<RemoverArquivoParam, Unit>;
export default IRemoverArquivoUseCase;
