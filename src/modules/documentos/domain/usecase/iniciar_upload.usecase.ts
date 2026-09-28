import type UseCase from '@/core/types/use_case';

export interface IniciarUploadItem {
  nome: string;
  descricao?: string | null;
  nomeOriginal: string;
  mimeType: string;
}

export interface IniciarUploadParam {
  pastaId: string;
  arquivos: IniciarUploadItem[];
  usuarioId: string;
}

export interface UploadIniciado {
  arquivoId: string;
  nome: string;
  storageKey: string;
  urlUpload: string;
}

type IIniciarUploadUseCase = UseCase<IniciarUploadParam, UploadIniciado[]>;
export default IIniciarUploadUseCase;
