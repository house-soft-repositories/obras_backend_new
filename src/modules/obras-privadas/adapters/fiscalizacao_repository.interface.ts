import AppException from '@/core/exceptions/app_exception';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import AsyncResult from '@/core/types/async_result';
import type { Unit } from '@/core/types/unit';
import FiscalizacaoEntity from '@/modules/obras-privadas/domain/entities/fiscalizacao.entity';
import { FiscalizacaoGlobalReadModel } from '@/modules/obras-privadas/infra/read-models/fiscalizacao_global_read_model';
import { ListFiscalizacoesGlobalQuery } from '@/modules/obras-privadas/infra/query/list_fiscalizacoes_global.query';

export type FiscalizacaoUpdate = Partial<
  ReturnType<FiscalizacaoEntity['toObject']>
>;

export default interface IFiscalizacaoRepository {
  save(
    entity: FiscalizacaoEntity,
  ): AsyncResult<AppException, FiscalizacaoEntity>;
  findById(id: string): AsyncResult<AppException, FiscalizacaoEntity | null>;
  findByObraPrivadaId(
    obraPrivadaId: string,
  ): AsyncResult<AppException, FiscalizacaoEntity[]>;
  findLastNumero(year: number): AsyncResult<AppException, string | null>;
  update(
    id: string,
    props: FiscalizacaoUpdate,
  ): AsyncResult<AppException, FiscalizacaoEntity | null>;
  delete(id: string): AsyncResult<AppException, Unit>;
  listGlobal(
    pageOptions: PageOptionsEntity,
    query: ListFiscalizacoesGlobalQuery,
  ): AsyncResult<AppException, PageEntity<FiscalizacaoGlobalReadModel>>;
}
