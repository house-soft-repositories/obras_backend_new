import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import ObservacaoEntity from '@/modules/obras/domain/entities/observacao.entity';

export default interface IObservacaoRepository {
  save(entity: ObservacaoEntity): AsyncResult<AppException, ObservacaoEntity>;
  findById(id: string): AsyncResult<AppException, ObservacaoEntity | null>;
  listByObra(obraId: string): AsyncResult<AppException, ObservacaoEntity[]>;
  delete(id: string): AsyncResult<AppException, void>;
}
