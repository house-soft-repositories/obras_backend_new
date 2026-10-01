import UseCase from '@/core/types/use_case';

export type ObterArquivoDownloadUrlParam = { id: string };

export type ArquivoDownloadUrl = {
  url: string;
  nome: string;
  mimeType: string | null;
};

type IObterArquivoDownloadUrlUseCase = UseCase<
  ObterArquivoDownloadUrlParam,
  ArquivoDownloadUrl
>;
export default IObterArquivoDownloadUrlUseCase;
