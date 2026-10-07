import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import { FormatoExportacaoLista } from '@/modules/relatorios/domain/enums/relatorios.enum';
import { renderizarListaObras } from '@/modules/relatorios/domain/relatorios/exportar_lista_obras';
import { RelatorioArquivo } from '@/modules/relatorios/domain/relatorios/relatorios_read_models';
import IExportarListaObrasRelatorioUseCase, {
  ExportarListaObrasRelatorioParam,
} from '@/modules/relatorios/domain/usecase/exportar_lista_obras_relatorio.usecase';
import RelatoriosServiceException from '@/modules/relatorios/exceptions/relatorios_service.exception';
import ListarObrasRelatorioService from '@/modules/relatorios/application/listar_obras_relatorio.service';

const MAX_ITENS_EXPORTACAO = 10000;

export default class ExportarListaObrasRelatorioService
  implements IExportarListaObrasRelatorioUseCase
{
  constructor(private readonly listar: ListarObrasRelatorioService) {}

  async execute(
    param: ExportarListaObrasRelatorioParam,
  ): AsyncResult<AppException, RelatorioArquivo> {
    try {
      if (!Object.values(FormatoExportacaoLista).includes(param.formato)) {
        return left(
          new RelatoriosServiceException({
            code: ErrorCodeConstants.RELATORIO_INVALID_FORMAT,
            statusCode: 400,
          }),
        );
      }
      const lista = await this.listar.execute({
        ...param,
        pagina: 1,
        tamanho: MAX_ITENS_EXPORTACAO,
      });
      if (lista.isLeft()) return left(lista.value);
      return right(
        renderizarListaObras(param.formato, lista.value.itens, lista.value.total),
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
