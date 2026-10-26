import type UseCase from '@/core/types/use_case';

export interface IniciarUploadTermoParalisacaoParam {
  contratoId: string;
  nomeOriginal: string;
  mimeType: string;
  usuarioId: string;
}

export interface UploadTermoParalisacaoIniciado {
  attachmentId: string;
  storageKey: string;
  urlUpload: string;
}

type IIniciarUploadTermoParalisacaoUseCase = UseCase<
  IniciarUploadTermoParalisacaoParam,
  UploadTermoParalisacaoIniciado
>;

export default IIniciarUploadTermoParalisacaoUseCase;
