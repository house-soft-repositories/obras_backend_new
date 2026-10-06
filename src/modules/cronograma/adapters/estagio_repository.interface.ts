import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import EstagioEntity from '@/modules/cronograma/domain/entities/estagio.entity';
import EstagioAcompanhamentoEntity from '@/modules/cronograma/domain/entities/estagio_acompanhamento.entity';
import EstagioComentarioEntity from '@/modules/cronograma/domain/entities/estagio_comentario.entity';
import MedicaoEntity from '@/modules/cronograma/domain/entities/medicao.entity';

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
  findAcompanhamentoById(
    obraId: string,
    estagioId: string,
    id: string,
  ): AsyncResult<AppException, EstagioAcompanhamentoEntity>;
  updateAcompanhamento(
    item: EstagioAcompanhamentoEntity,
  ): AsyncResult<AppException, EstagioAcompanhamentoEntity>;
  removeAcompanhamento(
    obraId: string,
    estagioId: string,
    id: string,
  ): AsyncResult<AppException, void>;
  saveComentario(
    item: EstagioComentarioEntity,
  ): AsyncResult<AppException, EstagioComentarioEntity>;
  findComentarioById(
    obraId: string,
    estagioId: string,
    id: string,
  ): AsyncResult<AppException, EstagioComentarioEntity>;
  updateComentario(
    item: EstagioComentarioEntity,
  ): AsyncResult<AppException, EstagioComentarioEntity>;
  removeComentario(
    obraId: string,
    estagioId: string,
    id: string,
  ): AsyncResult<AppException, void>;
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
  saveMedicao(item: MedicaoEntity): AsyncResult<AppException, MedicaoEntity>;
  listMedicoes(
    obraId: string,
    options: PageOptionsEntity,
  ): AsyncResult<AppException, PageEntity<MedicaoEntity>>;
  findMedicaoById(
    obraId: string,
    id: string,
  ): AsyncResult<AppException, MedicaoEntity>;
  updateMedicao(item: MedicaoEntity): AsyncResult<AppException, MedicaoEntity>;
  removeMedicao(obraId: string, id: string): AsyncResult<AppException, void>;
  nextMedicaoNumero(obraId: string): AsyncResult<AppException, number>;
  nextPosicao(obraId: string): AsyncResult<AppException, number>;
  atual(obraId: string): AsyncResult<AppException, EstagioEntity>;
}
