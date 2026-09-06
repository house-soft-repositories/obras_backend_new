import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import OrgaoEntity from '@/modules/orgaos/domain/entities/orgao.entity';

export default interface IOrgaoRepository {
  save(entity: OrgaoEntity): AsyncResult<AppException, OrgaoEntity>;
  findById(id: string): AsyncResult<AppException, OrgaoEntity>;
  findAll(): AsyncResult<AppException, OrgaoEntity[]>;
  existsLocalidade(localidadeId: string): AsyncResult<AppException, true>;
}
