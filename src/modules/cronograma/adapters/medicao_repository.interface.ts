import AppException from '@/core/exceptions/app_exception';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import AsyncResult from '@/core/types/async_result';
import MedicaoEntity from '@/modules/cronograma/domain/entities/medicao.entity';

export default interface IMedicaoRepository {
  save(item: MedicaoEntity): AsyncResult<AppException, MedicaoEntity>;
  findById(
    id: string,
    obraId: string,
  ): AsyncResult<AppException, MedicaoEntity>;
  list(
    obraId: string,
    options: PageOptionsEntity,
  ): AsyncResult<AppException, PageEntity<MedicaoEntity>>;
  update(item: MedicaoEntity): AsyncResult<AppException, MedicaoEntity>;
  remove(id: string, obraId: string): AsyncResult<AppException, void>;
  existsNormalNumero(
    obraId: string,
    numero: number,
    ignoreId?: string,
  ): AsyncResult<AppException, boolean>;
}
