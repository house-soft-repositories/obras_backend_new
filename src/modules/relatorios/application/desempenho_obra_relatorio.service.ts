import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import { DesempenhoObraRelatorio } from '@/modules/relatorios/domain/relatorios/relatorios_read_models';
import IDesempenhoObraRelatorioUseCase, {
  DesempenhoObraRelatorioParam,
} from '@/modules/relatorios/domain/usecase/desempenho_obra_relatorio.usecase';
import RelatoriosServiceException from '@/modules/relatorios/exceptions/relatorios_service.exception';
import RelatoriosQuery from '@/modules/relatorios/infra/query/relatorios_query';

export default class DesempenhoObraRelatorioService implements IDesempenhoObraRelatorioUseCase {
  constructor(private readonly query: RelatoriosQuery) {}

  async execute(
    param: DesempenhoObraRelatorioParam,
  ): AsyncResult<AppException, DesempenhoObraRelatorio> {
    try {
      const linha = (await this.query.carregarLinhas(param.usuarioId)).find(
        (item) => item.obraId === param.obraId,
      );
      if (!linha) {
        return left(
          new RelatoriosServiceException({
            code: ErrorCodeConstants.RELATORIO_NOT_FOUND,
            statusCode: 404,
          }),
        );
      }
      return right({
        obraId: linha.obraId,
        orgaoId: linha.orgaoId,
        statusObra: linha.statusObra,
        estagioAtualId: linha.estagioAtualId,
        prazoConclusao: linha.prazoConclusaoEstagio,
        percentualPrevisto: linha.percentualPrevisto,
        percentualRealizado: linha.percentualRealizado,
        semaforo: linha.semaforo,
        prazoVencido: linha.prazoVencido,
        dataReferencia: new Date().toISOString(),
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
