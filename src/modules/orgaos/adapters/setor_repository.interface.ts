import AppException from '@/core/exceptions/app_exception';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import AsyncResult from '@/core/types/async_result';
import SetorEntity from '@/modules/orgaos/domain/entities/setor.entity';

export default interface ISetorRepository {
  save(entity: SetorEntity): AsyncResult<AppException, SetorEntity>;
  findById(id: string): AsyncResult<AppException, SetorEntity>;
  findAllByOrgao(
    orgaoId: string,
    pageOptions: PageOptionsEntity,
  ): AsyncResult<AppException, PageEntity<SetorEntity>>;
  existsOrgao(orgaoId: string): AsyncResult<AppException, true>;
  countLinkedUsers(setorId: string): AsyncResult<AppException, number>;
}
