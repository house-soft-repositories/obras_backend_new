import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import ObraEntity from '@/modules/obras/domain/entities/obra.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import type { Unit } from '@/core/types/unit';
import { TipoObra } from '@/modules/obras/domain/enums/tipo_obra.enum';
import { StatusObra } from '@/modules/obras/domain/enums/status_obra.enum';

export interface ObraFindPageParams {
  status?: StatusObra;
  tipo?: TipoObra;
  orgaoId?: string;
  q?: string;
  pageOptions: PageOptionsEntity;
}

export default interface IObraRepository {
  save(e: ObraEntity): AsyncResult<AppException, ObraEntity>;
  duplicate(
    entity: ObraEntity,
    sourceObraId: string,
  ): AsyncResult<AppException, ObraEntity>;
  findLastCodigo(year: number): AsyncResult<AppException, string | null>;
  findById(id: string): AsyncResult<AppException, ObraEntity | null>;
  findPage(
    params: ObraFindPageParams,
  ): AsyncResult<AppException, PageEntity<ObraEntity>>;
  findOneWithRelations(
    id: string,
  ): AsyncResult<AppException, ObraEntity | null>;
  updatePartial(entity: ObraEntity): AsyncResult<AppException, ObraEntity>;
  softDelete(id: string): AsyncResult<AppException, Unit>;
}
