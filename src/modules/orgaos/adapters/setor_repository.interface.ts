import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import SetorEntity from '@/modules/orgaos/domain/entities/setor.entity';

export default interface ISetorRepository {
  save(entity: SetorEntity): AsyncResult<AppException, SetorEntity>;
  findById(id: string): AsyncResult<AppException, SetorEntity>;
  findAllByOrgao(orgaoId: string): AsyncResult<AppException, SetorEntity[]>;
  existsOrgao(orgaoId: string): AsyncResult<AppException, true>;
}
