import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import PagamentoEntity from '@/modules/obras/domain/entities/pagamento.entity';
import type { PagamentoComFonte } from '@/modules/obras/domain/usecase/pagamentos.usecase';

export default interface IPagamentoRepository {
  save(entity: PagamentoEntity): AsyncResult<AppException, PagamentoEntity>;
  findById(id: string): AsyncResult<AppException, PagamentoEntity | null>;
  findByIdWithFonte(id: string): AsyncResult<AppException, PagamentoComFonte | null>;
  listByObra(obraId: string): AsyncResult<AppException, PagamentoEntity[]>;
  listByObraWithFonte(obraId: string): AsyncResult<AppException, PagamentoComFonte[]>;
  delete(id: string): AsyncResult<AppException, void>;
}
