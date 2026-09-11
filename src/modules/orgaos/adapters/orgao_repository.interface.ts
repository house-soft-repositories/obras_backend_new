import AppException from '@/core/exceptions/app_exception';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import AsyncResult from '@/core/types/async_result';
import OrgaoEntity from '@/modules/orgaos/domain/entities/orgao.entity';

export default interface IOrgaoRepository {
  save(entity: OrgaoEntity): AsyncResult<AppException, OrgaoEntity>;
  findById(id: string): AsyncResult<AppException, OrgaoEntity>;
  findAll(
    pageOptions: PageOptionsEntity,
  ): AsyncResult<AppException, PageEntity<OrgaoEntity>>;
  existsLocalidade(localidadeId: string): AsyncResult<AppException, true>;
  findAllByLocalidadeId(localidadeId: string): AsyncResult<AppException, OrgaoEntity[]>;
}
