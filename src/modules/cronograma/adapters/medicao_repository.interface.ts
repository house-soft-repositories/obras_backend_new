import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import MedicaoEntity from '@/modules/cronograma/domain/entities/medicao.entity';
import type { Unit } from '@/core/types/unit';

export default interface IMedicaoRepository {
  save(item: MedicaoEntity): AsyncResult<AppException, MedicaoEntity>;
  list(
    obraId: string,
    options: PageOptionsEntity,
  ): AsyncResult<AppException, PageEntity<MedicaoEntity>>;
  findById(
    obraId: string,
    id: string,
  ): AsyncResult<AppException, MedicaoEntity>;
  update(item: MedicaoEntity): AsyncResult<AppException, MedicaoEntity>;
  remove(obraId: string, id: string): AsyncResult<AppException, Unit>;
  nextMedicaoNumero(obraId: string): AsyncResult<AppException, number>;
  existsNormalNumero(
    obraId: string,
    numero: number,
    ignoreId?: string,
  ): AsyncResult<AppException, boolean>;
}
