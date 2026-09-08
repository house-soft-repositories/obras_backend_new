import AppException from '@/core/exceptions/app_exception';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import AsyncResult from '@/core/types/async_result';
import SetorEntity from '@/modules/orgaos/domain/entities/setor.entity';
import { SetorWithOrgaoReadModel } from '@/modules/orgaos/infra/read-models/setor_with_orgao_read_model';

export default interface ISetorRepository {
  save(entity: SetorEntity): AsyncResult<AppException, SetorEntity>;
  findById(id: string): AsyncResult<AppException, SetorEntity>;
  findAllByOrgao(
    pageOptions: PageOptionsEntity,
  ): AsyncResult<AppException, PageEntity<SetorWithOrgaoReadModel>>;
  findAllByOrgaoId(
    orgaoId: string,
  ): AsyncResult<AppException, SetorWithOrgaoReadModel[]>;
  existsOrgao(orgaoId: string): AsyncResult<AppException, true>;
  countLinkedUsers(setorId: string): AsyncResult<AppException, number>;
}
