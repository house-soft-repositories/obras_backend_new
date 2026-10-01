import UseCase from '@/core/types/use_case';
import ObraPrivadaArquivoEntity from '@/modules/obras-privadas/domain/entities/obra_privada_arquivo.entity';

export type ConfirmarUploadArquivoParam = {
  id: string;
  tamanhoBytes?: number;
  mimeType?: string;
};

type IConfirmarUploadArquivoUseCase = UseCase<
  ConfirmarUploadArquivoParam,
  ObraPrivadaArquivoEntity
>;
export default IConfirmarUploadArquivoUseCase;
