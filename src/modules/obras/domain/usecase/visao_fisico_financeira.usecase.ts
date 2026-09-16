import type UseCase from '@/core/types/use_case';

export interface IndicadorFinanceiro {
  valor: string;
  percentual: number;
}

export interface VisaoFisicoFinanceira {
  obraId: string;
  contratadoInicial: IndicadorFinanceiro;
  aditivadoTotal: IndicadorFinanceiro;
  totalContratado: IndicadorFinanceiro;
  medidoTotal: IndicadorFinanceiro;
  empenhadoTotal: IndicadorFinanceiro;
  liquidadoTotal: IndicadorFinanceiro;
  pagoTotal: IndicadorFinanceiro;
}

export type IVisaoFisicoFinanceiraUseCase = UseCase<string, VisaoFisicoFinanceira>;
