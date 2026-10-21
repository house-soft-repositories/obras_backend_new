import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import EstagioEntity from '@/modules/cronograma/domain/entities/estagio.entity';
import DataAgregadasReadModel from '@/modules/cronograma/domain/read_models/data_agregadas.read_model';
import type { Unit } from '@/core/types/unit';

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
  listRootEstagios(
    obraId: string,
  ): AsyncResult<AppException, EstagioEntity[]>;
  update(e: EstagioEntity): AsyncResult<AppException, EstagioEntity>;
  remove(id: string, obraId: string): AsyncResult<AppException, Unit>;
  reorder(
    obraId: string,
    items: { id: string; posicao: number }[],
  ): AsyncResult<AppException, Unit>;
  updatePercentualDireto(
    obraId: string,
    id: string,
    percentual: number,
  ): AsyncResult<AppException, EstagioEntity>;
  datasAgregadas(
    obraId: string,
  ): AsyncResult<AppException, DataAgregadasReadModel>;
  nextPosicao(obraId: string): AsyncResult<AppException, number>;
  atual(obraId: string): AsyncResult<AppException, EstagioEntity>;
  hasChildren(
    obraId: string,
    estagioId: string,
  ): AsyncResult<AppException, boolean>;
}
