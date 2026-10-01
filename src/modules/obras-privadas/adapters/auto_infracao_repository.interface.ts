import AppException from '@/core/exceptions/app_exception';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import AsyncResult from '@/core/types/async_result';
import AutoInfracaoEntity from '@/modules/obras-privadas/domain/entities/auto_infracao.entity';
import { AutoGlobalReadModel } from '@/modules/obras-privadas/infra/read-models/auto_global_read_model';
import { ListAutosGlobalQuery } from '@/modules/obras-privadas/infra/query/list_autos_global.query';

export type AutoInfracaoUpdate = Partial<
  ReturnType<AutoInfracaoEntity['toObject']>
>;

export default interface IAutoInfracaoRepository {
  save(
    entity: AutoInfracaoEntity,
  ): AsyncResult<AppException, AutoInfracaoEntity>;
  findById(id: string): AsyncResult<AppException, AutoInfracaoEntity | null>;
  findByObraPrivadaId(
    obraPrivadaId: string,
  ): AsyncResult<AppException, AutoInfracaoEntity[]>;
  findLastNumero(year: number): AsyncResult<AppException, string | null>;
  update(
    id: string,
    props: AutoInfracaoUpdate,
  ): AsyncResult<AppException, AutoInfracaoEntity | null>;
  listGlobal(
    pageOptions: PageOptionsEntity,
    query: ListAutosGlobalQuery,
  ): AsyncResult<AppException, PageEntity<AutoGlobalReadModel>>;
  countByTipo(): AsyncResult<AppException, Record<string, number>>;
}
