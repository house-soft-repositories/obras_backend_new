import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import { aplicarFiltroObras } from '@/modules/relatorios/domain/relatorios/filtro_obras';
import { DashboardRelatorio } from '@/modules/relatorios/domain/relatorios/relatorios_read_models';
import IDashboardRelatorioUseCase, {
  DashboardRelatorioParam,
} from '@/modules/relatorios/domain/usecase/dashboard_relatorio.usecase';
import RelatoriosServiceException from '@/modules/relatorios/exceptions/relatorios_service.exception';
import RelatoriosQuery from '@/modules/relatorios/infra/query/relatorios_query';
import { agregarQuantificadoresRelatorio } from '@/modules/relatorios/application/quantificadores_relatorio.service';
import FluxoFisicoFinanceiroRelatorioService from '@/modules/relatorios/application/fluxo_fisico_financeiro_relatorio.service';

export default class DashboardRelatorioService implements IDashboardRelatorioUseCase {
  constructor(
    private readonly query: RelatoriosQuery,
    private readonly fluxo: FluxoFisicoFinanceiroRelatorioService,
  ) {}

  async execute(
    param: DashboardRelatorioParam,
  ): AsyncResult<AppException, DashboardRelatorio> {
    try {
      let linhas = aplicarFiltroObras(
        await this.query.carregarLinhas(param.usuarioId),
        param,
      );
      if (param.orgaoId) linhas = linhas.filter((linha) => linha.orgaoId === param.orgaoId);
      const porOrgao = new Map<string | null, typeof linhas>();
      for (const linha of linhas) {
        const key = linha.orgaoId ?? null;
        if (!porOrgao.has(key)) porOrgao.set(key, []);
        porOrgao.get(key)?.push(linha);
      }
      const fluxoAgregado = await this.fluxo.execute(param);
      if (fluxoAgregado.isLeft()) return left(fluxoAgregado.value);
      const contagens = await this.query.contagens();
      return right({
        quantificadoresPorOrgao: [...porOrgao.entries()].map(([orgaoId, items]) =>
          agregarQuantificadoresRelatorio(items, orgaoId),
        ),
        fluxoAgregado: fluxoAgregado.value,
        contagemPorStatus: contagens.contagemPorStatus,
        obrasPorOrgao: contagens.obrasPorOrgao,
      });
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
}
