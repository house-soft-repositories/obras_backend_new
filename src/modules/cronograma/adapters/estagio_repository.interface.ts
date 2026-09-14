import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import EstagioEntity from '@/modules/cronograma/domain/entities/estagio.entity';

export default interface IEstagioRepository {
  save(e: EstagioEntity): AsyncResult<AppException, EstagioEntity>;
  saveMany(items: EstagioEntity[]): AsyncResult<AppException, EstagioEntity[]>;
  findById(
    id: string,
    obraId: string,
  ): AsyncResult<AppException, EstagioEntity>;
  list(
    obraId: string,
    options: PageOptionsEntity,
  ): AsyncResult<AppException, PageEntity<EstagioEntity>>;
  update(e: EstagioEntity): AsyncResult<AppException, EstagioEntity>;
  remove(id: string, obraId: string): AsyncResult<AppException, void>;
  reorder(
    obraId: string,
    items: { id: string; posicao: number }[],
  ): AsyncResult<AppException, void>;
}
