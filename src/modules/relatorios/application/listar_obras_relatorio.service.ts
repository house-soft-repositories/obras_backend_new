import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import { ListarCalendarioObrasRelatorioParam } from '@/modules/relatorios/domain/usecase/listar_calendario_obras_relatorio.usecase';
import { ListarMapaObrasRelatorioParam } from '@/modules/relatorios/domain/usecase/listar_mapa_obras_relatorio.usecase';
import IListarObrasRelatorioUseCase, {
  ListarObrasRelatorioParam,
} from '@/modules/relatorios/domain/usecase/listar_obras_relatorio.usecase';
import {
  ItemListaObrasRelatorio,
  ListaObrasRelatorio,
} from '@/modules/relatorios/domain/relatorios/relatorios_read_models';
import RelatorioObrasEntity from '@/modules/relatorios/domain/entities/relatorio_obras.entity';
import RelatoriosQuery from '@/modules/relatorios/infra/query/relatorios_query';
import RelatoriosServiceException from '@/modules/relatorios/exceptions/relatorios_service.exception';

// Telas secundárias (mapa/calendário) sem paginação própria: janela ampla para
// o filtro SQL e recorte em memória só do critério da tela.
const TAMANHO_TELAS_SECUNDARIAS = 10000;

export default class ListarObrasRelatorioService implements IListarObrasRelatorioUseCase {
  constructor(private readonly query: RelatoriosQuery) {}

  async execute(
    param: ListarObrasRelatorioParam,
  ): AsyncResult<AppException, ListaObrasRelatorio> {
    try {
      const { linhas, total } = await this.query.listarComFiltro(
        param.usuarioId,
        param,
      );
      return right({
        itens: RelatorioObrasEntity.fromLinhas(linhas).paraItensLista(),
        total,
      });
    } catch (error) {
      return this.failure(error);
    }
  }

  async listarMapa(
    param: ListarMapaObrasRelatorioParam,
  ): AsyncResult<AppException, ItemListaObrasRelatorio[]> {
    try {
      const { linhas } = await this.query.listarComFiltro(param.usuarioId, {
        ...param,
        pagina: 1,
        tamanho: TAMANHO_TELAS_SECUNDARIAS,
      });
      return right(
        RelatorioObrasEntity.fromLinhas(linhas).paraMapa(),
      );
    } catch (error) {
      return this.failure(error);
    }
  }

  async listarCalendario(
    param: ListarCalendarioObrasRelatorioParam,
  ): AsyncResult<AppException, ItemListaObrasRelatorio[]> {
    try {
      const { linhas } = await this.query.listarComFiltro(param.usuarioId, {
        ...param,
        pagina: 1,
        tamanho: TAMANHO_TELAS_SECUNDARIAS,
      });
      return right(
        RelatorioObrasEntity.fromLinhas(linhas).paraCalendario(),
      );
    } catch (error) {
      return this.failure(error);
    }
  }

  private failure<T>(error: unknown): AsyncResult<AppException, T> {
    if (error instanceof AppException) return Promise.resolve(left(error));
    return Promise.resolve(
      left(
        new RelatoriosServiceException({
          code: ErrorCodeConstants.RELATORIO_SERVICE_FAILED,
          statusCode: 500,
          cause: error,
        }),
      ),
    );
  }
}
