import UseCase from '@/core/types/use_case';
import type { Unit } from '@/core/types/unit';

export type ExcluirArquivoParam = { id: string };

type IExcluirArquivoUseCase = UseCase<ExcluirArquivoParam, Unit>;
export default IExcluirArquivoUseCase;
