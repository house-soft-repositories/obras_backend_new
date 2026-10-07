import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import { aplicarFiltroObras } from '@/modules/relatorios/domain/relatorios/filtro_obras';
import {
  FluxoFisicoFinanceiroRelatorio,
  LinhaObraRelatorio,
  ValoresFluxo,
} from '@/modules/relatorios/domain/relatorios/relatorios_read_models';
import IFluxoFisicoFinanceiroRelatorioUseCase, {
  FluxoFisicoFinanceiroRelatorioParam,
} from '@/modules/relatorios/domain/usecase/fluxo_fisico_financeiro_relatorio.usecase';
import RelatoriosServiceException from '@/modules/relatorios/exceptions/relatorios_service.exception';
import RelatoriosQuery from '@/modules/relatorios/infra/query/relatorios_query';

function pct(valor: number, total: number): number {
  return total > 0 ? Number(((valor / total) * 100).toFixed(2)) : 0;
}

function mediaPercentualFisico(linhas: LinhaObraRelatorio[]): number {
  if (!linhas.length) return 0;
  const soma = linhas.reduce((total, linha) => total + linha.percentualRealizado, 0);
  return Number((soma / linhas.length).toFixed(2));
}

function valoresZerados(): ValoresFluxo {
  return {
    contratadoInicial: 0,
    aditivadoTotal: 0,
    medidoTotal: 0,
    empenhadoTotal: 0,
    liquidadoTotal: 0,
    pagoTotal: 0,
  };
}

function somarValores(acc: ValoresFluxo, valores: ValoresFluxo): void {
  acc.contratadoInicial += valores.contratadoInicial;
  acc.aditivadoTotal += valores.aditivadoTotal;
  acc.medidoTotal += valores.medidoTotal;
  acc.empenhadoTotal += valores.empenhadoTotal;
  acc.liquidadoTotal += valores.liquidadoTotal;
  acc.pagoTotal += valores.pagoTotal;
}

export default class FluxoFisicoFinanceiroRelatorioService
  implements IFluxoFisicoFinanceiroRelatorioUseCase
{
  constructor(private readonly query: RelatoriosQuery) {}

  async execute(
    param: FluxoFisicoFinanceiroRelatorioParam,
  ): AsyncResult<AppException, FluxoFisicoFinanceiroRelatorio> {
    try {
      const linhas = aplicarFiltroObras(
        await this.query.carregarLinhas(param.usuarioId),
        param,
      );
      if (param.obraId) {
        const linha = linhas.find((item) => item.obraId === param.obraId);
        if (!linha) return left(this.notFound());
        const mapa = await this.query.valoresFluxoAgregados([linha.obraId]);
        return right(
          this.montar(
            linha.obraId,
            linha.orgaoId,
            mapa.get(linha.obraId) ?? valoresZerados(),
            linha.percentualRealizado,
          ),
        );
      }
      const filtradas = param.orgaoId
        ? linhas.filter((linha) => linha.orgaoId === param.orgaoId)
        : linhas;
      if (filtradas.length === 0)
        return right(
          this.montar(null, param.orgaoId ?? null, valoresZerados(), 0),
        );
      const mapa = await this.query.valoresFluxoAgregados(
        filtradas.map((linha) => linha.obraId),
      );
      const acc = valoresZerados();
      for (const linha of filtradas)
        somarValores(acc, mapa.get(linha.obraId) ?? valoresZerados());
      return right(
        this.montar(null, param.orgaoId ?? null, acc, mediaPercentualFisico(filtradas)),
      );
    } catch (error) {
      if (error instanceof AppException) return left(error);
      return left(
        new RelatoriosServiceException({
          code: ErrorCodeConstants.RELATORIO_SERVICE_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }

  private montar(
    obraId: string | null,
    orgaoId: string | null,
    valores: ValoresFluxo,
    percentualFisico: number,
  ): FluxoFisicoFinanceiroRelatorio {
    const total = valores.contratadoInicial + valores.aditivadoTotal;
    return {
      obraId,
      orgaoId,
      contratadoInicial: valores.contratadoInicial.toFixed(2),
      aditivadoTotal: valores.aditivadoTotal.toFixed(2),
      totalContratado: total.toFixed(2),
      medidoTotal: valores.medidoTotal.toFixed(2),
      empenhadoTotal: valores.empenhadoTotal.toFixed(2),
      liquidadoTotal: valores.liquidadoTotal.toFixed(2),
      pagoTotal: valores.pagoTotal.toFixed(2),
      percentuaisPorIndicador: {
        medido: pct(valores.medidoTotal, total),
        empenhado: pct(valores.empenhadoTotal, total),
        liquidado: pct(valores.liquidadoTotal, total),
        pago: pct(valores.pagoTotal, total),
      },
      percentualFisico,
      percentualFinanceiro: pct(valores.pagoTotal, total),
      dataReferencia: new Date().toISOString(),
    };
  }

  private notFound(): RelatoriosServiceException {
    return new RelatoriosServiceException({
      code: ErrorCodeConstants.RELATORIO_NOT_FOUND,
      statusCode: 404,
    });
  }
}
