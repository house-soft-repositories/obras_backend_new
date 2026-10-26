import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import type { EntityManager } from 'typeorm';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import MedicaoEntity from '@/modules/cronograma/domain/entities/medicao.entity';
import SaldoMedicaoReadModel from '@/modules/cronograma/domain/read_models/saldo_medicao.read_model';
import type { Unit } from '@/core/types/unit';

export default interface IMedicaoRepository {
  save(
    item: MedicaoEntity,
    manager?: EntityManager,
  ): AsyncResult<AppException, MedicaoEntity>;
  list(
    obraId: string,
    options: PageOptionsEntity,
  ): AsyncResult<AppException, PageEntity<MedicaoEntity>>;
  findById(
    obraId: string,
    id: string,
    manager?: EntityManager,
  ): AsyncResult<AppException, MedicaoEntity>;
  update(
    item: MedicaoEntity,
    manager?: EntityManager,
  ): AsyncResult<AppException, MedicaoEntity>;
  remove(obraId: string, id: string): AsyncResult<AppException, Unit>;
  nextMedicaoNumero(obraId: string): AsyncResult<AppException, number>;
  existsNormalNumero(
    obraId: string,
    numero: number,
    ignoreId?: string,
  ): AsyncResult<AppException, boolean>;
  getSaldoMedicao(
    obraId: string,
    ignoreMedicaoId?: string,
    manager?: EntityManager,
  ): AsyncResult<AppException, SaldoMedicaoReadModel>;
}
