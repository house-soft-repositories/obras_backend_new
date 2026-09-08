import AppException from '@/core/exceptions/app_exception';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import AsyncResult from '@/core/types/async_result';
import LocalidadeEntity from '@/modules/localidades/domain/entities/localidade.entity';

export default interface ILocalidadeRepository {
  save(entity: LocalidadeEntity): AsyncResult<AppException, LocalidadeEntity>;
  findById(id: string): AsyncResult<AppException, LocalidadeEntity>;
  findAll(
    pageOptions: PageOptionsEntity,
  ): AsyncResult<AppException, PageEntity<LocalidadeEntity>>;
}
