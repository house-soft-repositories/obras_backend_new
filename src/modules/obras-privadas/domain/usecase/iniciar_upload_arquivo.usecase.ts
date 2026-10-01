import UseCase from '@/core/types/use_case';
import {
  CategoriaArquivoPrivado,
  VinculoArquivoPrivado,
} from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';

export type ArquivoUploadItemParam = {
  nomeOriginal: string;
  nome?: string;
  descricao?: string;
  categoria?: CategoriaArquivoPrivado;
  mimeType?: string;
  latitude?: string;
  longitude?: string;
  capturadoEm?: string;
  ordem?: number;
};

export type IniciarUploadArquivoParam = {
  obraPrivadaId: string;
  vinculo: VinculoArquivoPrivado;
  vinculoId?: string;
  arquivos: ArquivoUploadItemParam[];
  usuarioId: string;
};

export type UploadArquivoPreparado = {
  arquivoId: string;
  nome: string;
  urlUpload: string;
};

type IIniciarUploadArquivoUseCase = UseCase<
  IniciarUploadArquivoParam,
  UploadArquivoPreparado[]
>;
export default IIniciarUploadArquivoUseCase;
