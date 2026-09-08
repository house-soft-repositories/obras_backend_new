import AppException from '@/core/exceptions/app_exception';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import AsyncResult from '@/core/types/async_result';
import FonteEntity from '@/modules/fontes/domain/entities/fonte.entity';
export default interface IFonteRepository {
  save(entity: FonteEntity): AsyncResult<AppException, FonteEntity>;
  findByCodigo(codigo: string): AsyncResult<AppException, FonteEntity | null>;
  findById(id: string): AsyncResult<AppException, FonteEntity | null>;
  findAll(pageOptions: PageOptionsEntity): AsyncResult<AppException, PageEntity<FonteEntity>>;
}
