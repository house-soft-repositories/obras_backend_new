import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import LocalidadeEntity from '@/modules/localidades/domain/entities/localidade.entity';

export default interface ILocalidadeRepository {
  save(entity: LocalidadeEntity): AsyncResult<AppException, LocalidadeEntity>;
  findById(id: string): AsyncResult<AppException, LocalidadeEntity>;
  findAll(): AsyncResult<AppException, LocalidadeEntity[]>;
}
