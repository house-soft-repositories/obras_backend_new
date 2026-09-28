import type UseCase from '@/core/types/use_case';

export interface GerarDownloadParam {
  arquivoId: string;
}

export interface DownloadUrl {
  url: string;
}

type IGerarDownloadUseCase = UseCase<GerarDownloadParam, DownloadUrl>;
export default IGerarDownloadUseCase;
