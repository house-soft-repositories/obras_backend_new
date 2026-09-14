import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import AditivoEntity from '@/modules/contratos/domain/entities/aditivo.entity';
export default interface IAditivoRepository {
  save(e: AditivoEntity): AsyncResult<AppException, AditivoEntity>;
  listByContrato(
    contratoId: string,
  ): AsyncResult<AppException, AditivoEntity[]>;
  findById(id: string): AsyncResult<AppException, AditivoEntity | null>;
  delete(id: string): AsyncResult<AppException, true>;
}
