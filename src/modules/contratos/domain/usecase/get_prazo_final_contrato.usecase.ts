import type UseCase from '@/core/types/use_case';

export interface GetPrazoFinalContratoParam {
  id: string;
}

export interface PrazoFinalContratoResult {
  prazoFinal: string;
  totalDias: number;
  diasBase: number;
  diasParalisacoes: number;
  diasAditivos: number;
}

type IGetPrazoFinalContratoUseCase = UseCase<
  GetPrazoFinalContratoParam,
  PrazoFinalContratoResult
>;

export default IGetPrazoFinalContratoUseCase;
