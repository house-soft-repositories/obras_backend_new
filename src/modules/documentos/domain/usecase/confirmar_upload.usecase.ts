import type UseCase from '@/core/types/use_case';
import ArquivoEntity from '@/modules/documentos/domain/entities/arquivo.entity';

export interface ConfirmarUploadParam {
  arquivoId: string;
  tamanhoBytes: number;
  mimeType?: string;
}

type IConfirmarUploadUseCase = UseCase<ConfirmarUploadParam, ArquivoEntity>;
export default IConfirmarUploadUseCase;
