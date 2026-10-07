import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import { SemaforoDesempenho } from '@/modules/relatorios/domain/enums/relatorios.enum';
import RelatorioObrasEntity from '@/modules/relatorios/domain/entities/relatorio_obras.entity';
import { agregarQuantificadores } from '@/modules/relatorios/domain/logic/desempenho.logic';
import { QuantificadoresObrasRelatorio } from '@/modules/relatorios/domain/relatorios/relatorios_read_models';
import IQuantificadoresRelatorioUseCase, {
  QuantificadoresRelatorioParam,
} from '@/modules/relatorios/domain/usecase/quantificadores_relatorio.usecase';
import RelatoriosServiceException from '@/modules/relatorios/exceptions/relatorios_service.exception';
import RelatoriosQuery from '@/modules/relatorios/infra/query/relatorios_query';

export function agregarQuantificadoresRelatorio(
  linhas: {
    statusObra: string;
    percentualPrevisto: number;
    percentualRealizado: number;
    semaforo: SemaforoDesempenho | null;
    prazoVencido: boolean;
  }[],
  orgaoId: string | null = null,
): QuantificadoresObrasRelatorio {
  const agregados = agregarQuantificadores(
    linhas.map((linha) => ({
      status: linha.statusObra,
      desempenho: {
        percentualPrevisto: linha.percentualPrevisto,
        percentualRealizado: linha.percentualRealizado,
        semaforo: linha.semaforo,
        prazoVencido: linha.prazoVencido,
      },
    })),
  );
  return { ...agregados, orgaoId, dataReferencia: new Date().toISOString() };
}

export default class QuantificadoresRelatorioService implements IQuantificadoresRelatorioUseCase {
  constructor(private readonly query: RelatoriosQuery) {}

  async execute(
    param: QuantificadoresRelatorioParam,
  ): AsyncResult<AppException, QuantificadoresObrasRelatorio> {
    try {
      const linhas = await this.query.carregarLinhas(param.usuarioId);
      return right(
        RelatorioObrasEntity.fromLinhas(linhas)
          .filtrar(param)
          .agregarQuantificadores(),
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
}
