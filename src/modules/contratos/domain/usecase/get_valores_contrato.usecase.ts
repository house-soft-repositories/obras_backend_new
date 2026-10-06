import type UseCase from '@/core/types/use_case';

export interface GetValoresContratoParam {
  id: string;
}

export interface ValoresContratoResult {
  valorOriginal: string;
  valorAditivos: string;
  valorTotal: string;
}

type IGetValoresContratoUseCase = UseCase<
  GetValoresContratoParam,
  ValoresContratoResult
>;

export default IGetValoresContratoUseCase;
