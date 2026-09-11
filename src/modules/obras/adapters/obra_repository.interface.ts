import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import ObraEntity from '@/modules/obras/domain/entities/obra.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import PageEntity from '@/core/pagination/domain/entities/page.entity';

export interface ObraFindPageParams {
  status?: string;
  tipo?: string;
  orgaoId?: string;
  q?: string;
  pageOptions: PageOptionsEntity;
}

export default interface IObraRepository {
  save(e: ObraEntity): AsyncResult<AppException, ObraEntity>;
  findLastCodigo(year: number): AsyncResult<AppException, string | null>;
  findById(id: string): AsyncResult<AppException, ObraEntity | null>;
  findPage(params: ObraFindPageParams): AsyncResult<AppException, PageEntity<ObraEntity>>;
  findOneWithRelations(id: string): AsyncResult<AppException, ObraEntity | null>;
  updatePartial(entity: ObraEntity): AsyncResult<AppException, ObraEntity>;
  softDelete(id: string): AsyncResult<AppException, void>;
}
