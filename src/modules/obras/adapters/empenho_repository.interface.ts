import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import EmpenhoEntity from '@/modules/obras/domain/entities/empenho.entity';

export default interface IEmpenhoRepository {
  save(entity: EmpenhoEntity): AsyncResult<AppException, EmpenhoEntity>;
  findById(id: string): AsyncResult<AppException, EmpenhoEntity | null>;
  listByObra(obraId: string): AsyncResult<AppException, EmpenhoEntity[]>;
  sumLiquidado(empenhoId: string, ignoreId?: string): AsyncResult<AppException, number>;
  delete(id: string): AsyncResult<AppException, void>;
}
