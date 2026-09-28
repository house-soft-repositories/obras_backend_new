import type UseCase from '@/core/types/use_case';
import ArquivoEntity from '@/modules/documentos/domain/entities/arquivo.entity';

export interface MoverArquivoParam {
  arquivoId: string;
  pastaDestinoId: string;
  usuarioId: string;
}

type IMoverArquivoUseCase = UseCase<MoverArquivoParam, ArquivoEntity>;
export default IMoverArquivoUseCase;
