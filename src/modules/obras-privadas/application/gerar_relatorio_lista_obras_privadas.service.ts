import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IGerarRelatorioListaObrasPrivadasUseCase, {
  GerarRelatorioListaObrasPrivadasParam,
  RelatorioArquivo,
} from '@/modules/obras-privadas/domain/usecase/gerar_relatorio_lista_obras_privadas.usecase';
import IListarObrasUseCase from '@/modules/obras-privadas/domain/usecase/listar_obras.usecase';
import ObraPrivadaServiceException from '@/modules/obras-privadas/exceptions/obra_privada_service.exception';
import { ObraPrivadaListReadModel } from '@/modules/obras-privadas/infra/read-models/obra_privada_list_read_model';
import { gerarPdfSimples } from '@/modules/obras-privadas/infra/reporting/pdf_simples';
import {
  gerarCsvLista,
  montarSecoesLista,
} from '@/modules/obras-privadas/domain/relatorios/relatorio_privadas';

const MAX_ITENS_EXPORTACAO = 1000;

export default class GerarRelatorioListaObrasPrivadasService implements IGerarRelatorioListaObrasPrivadasUseCase {
  constructor(private readonly listarObras: IListarObrasUseCase) {}

  async execute(
    param: GerarRelatorioListaObrasPrivadasParam,
  ): AsyncResult<AppException, RelatorioArquivo> {
    try {
      const { formato, ...query } = param;
      const page = await this.listarObras.execute({
        ...query,
        page: 1,
        take: MAX_ITENS_EXPORTACAO,
        order: 'ASC',
      });
      if (page.isLeft()) return left(page.value);
      return right(this.render(formato, page.value));
    } catch (error) {
      if (error instanceof AppException) return left(error);
      return left(
        new ObraPrivadaServiceException({
          code: ErrorCodeConstants.OBRA_PRIVADA_REPOSITORY_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }

  private render(
    formato: string,
    page: PageEntity<ObraPrivadaListReadModel>,
  ): RelatorioArquivo {
    if (formato === 'PDF') {
      return {
        buffer: gerarPdfSimples(
          'Obras Privadas',
          `Total: ${page.pageMeta.itemCount} obra(s)`,
          montarSecoesLista(page.pageData, page.pageMeta.itemCount),
        ),
        filename: 'obras-privadas.pdf',
        contentType: 'application/pdf',
      };
    }
    return {
      buffer: Buffer.from(gerarCsvLista(page.pageData), 'utf8'),
      filename: 'obras-privadas.csv',
      contentType: 'text/csv; charset=utf-8',
    };
  }
}
