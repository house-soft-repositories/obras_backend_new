import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import EstagioEntity from '@/modules/cronograma/domain/entities/estagio.entity';
import EstagioAcompanhamentoEntity from '@/modules/cronograma/domain/entities/estagio_acompanhamento.entity';
import EstagioComentarioEntity from '@/modules/cronograma/domain/entities/estagio_comentario.entity';

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
  saveAcompanhamento(
    item: EstagioAcompanhamentoEntity,
  ): AsyncResult<AppException, EstagioAcompanhamentoEntity>;
  saveComentario(
    item: EstagioComentarioEntity,
  ): AsyncResult<AppException, EstagioComentarioEntity>;
  updatePercentualDireto(
    obraId: string,
    id: string,
    percentual: number,
  ): AsyncResult<AppException, EstagioEntity>;
  datasAgregadas(
    obraId: string,
  ): AsyncResult<
    AppException,
    { dataInicio: string | null; dataFim: string | null }
  >;
}
