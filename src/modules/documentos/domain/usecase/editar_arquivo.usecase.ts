import type UseCase from '@/core/types/use_case';
import ArquivoEntity from '@/modules/documentos/domain/entities/arquivo.entity';

export interface EditarArquivoParam {
  arquivoId: string;
  nome?: string;
  descricao?: string | null;
  usuarioId: string;
}

type IEditarArquivoUseCase = UseCase<EditarArquivoParam, ArquivoEntity>;
export default IEditarArquivoUseCase;
