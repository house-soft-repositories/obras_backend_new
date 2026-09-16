import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import PagamentoEntity from '@/modules/obras/domain/entities/pagamento.entity';

export default interface IPagamentoRepository {
  save(entity: PagamentoEntity): AsyncResult<AppException, PagamentoEntity>;
  findById(id: string): AsyncResult<AppException, PagamentoEntity | null>;
  listByObra(obraId: string): AsyncResult<AppException, PagamentoEntity[]>;
  delete(id: string): AsyncResult<AppException, void>;
}
