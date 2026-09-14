import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import ParalisacaoEntity from '@/modules/contratos/domain/entities/paralisacao.entity';
export default interface IParalisacaoRepository {
  save(e: ParalisacaoEntity): AsyncResult<AppException, ParalisacaoEntity>;
  listByContrato(
    contratoId: string,
  ): AsyncResult<AppException, ParalisacaoEntity[]>;
  findById(id: string): AsyncResult<AppException, ParalisacaoEntity | null>;
  delete(id: string): AsyncResult<AppException, true>;
}
