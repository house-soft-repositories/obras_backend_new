import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import LiquidacaoEntity from '@/modules/obras/domain/entities/liquidacao.entity';

export default interface ILiquidacaoRepository {
  save(entity: LiquidacaoEntity): AsyncResult<AppException, LiquidacaoEntity>;
  findById(id: string): AsyncResult<AppException, LiquidacaoEntity | null>;
  listByObra(obraId: string): AsyncResult<AppException, LiquidacaoEntity[]>;
  sumPago(liquidacaoId: string, ignoreId?: string): AsyncResult<AppException, number>;
  delete(id: string): AsyncResult<AppException, void>;
}
