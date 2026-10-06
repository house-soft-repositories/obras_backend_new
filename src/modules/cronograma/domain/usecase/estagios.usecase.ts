import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import EstagioEntity from '@/modules/cronograma/domain/entities/estagio.entity';
import EstagioAcompanhamentoEntity from '@/modules/cronograma/domain/entities/estagio_acompanhamento.entity';
import EstagioComentarioEntity from '@/modules/cronograma/domain/entities/estagio_comentario.entity';
import MedicaoEntity from '@/modules/cronograma/domain/entities/medicao.entity';
import { TipoMedicao } from '@/modules/cronograma/domain/enums/cronograma.enums';
export type CreateEstagioParam = {
  obraId: string;
  nome: string;
  posicao?: number;
  dataInicio?: string;
  dataFim?: string;
  responsavelUsuarioId?: string;
};
export type UpdateEstagioParam = {
  obraId: string;
  id: string;
  nome?: string;
  posicao?: number;
  dataInicio?: string | null;
  dataFim?: string | null;
  responsavelUsuarioId?: string | null;
};
export type CreateAcompanhamentoParam = {
  obraId: string;
  estagioId: string;
  percentual: number;
  data: string;
  observacao?: string;
  autorUsuarioId: string;
};
export type UpdateAcompanhamentoParam = {
  obraId: string;
  estagioId: string;
  id: string;
  percentual?: number;
  data?: string;
  observacao?: string | null;
};
export type CreateComentarioParam = {
  obraId: string;
  estagioId: string;
  texto: string;
  autorUsuarioId: string;
};
export type UpdateComentarioParam = {
  obraId: string;
  estagioId: string;
  id: string;
  texto: string;
};
export type CreateMedicaoParam = {
  obraId: string;
  tipo: TipoMedicao;
  dataMedicao: string;
  observacao?: string;
  itens: { fonteId: string; valor: number }[];
};
export type UpdateMedicaoParam = {
  obraId: string;
  id: string;
  numero?: number;
  tipo?: TipoMedicao;
  dataMedicao?: string;
  observacao?: string | null;
  itens?: { fonteId: string; valor: number }[];
};
export type IEstagiosUseCase = {
  create(p: CreateEstagioParam): AsyncResult<AppException, EstagioEntity>;
  createMany(
    obraId: string,
    items: CreateEstagioParam[],
  ): AsyncResult<AppException, EstagioEntity[]>;
  list(
    obraId: string,
    o: PageOptionsEntity,
  ): AsyncResult<AppException, PageEntity<EstagioEntity>>;
  get(obraId: string, id: string): AsyncResult<AppException, EstagioEntity>;
  update(p: UpdateEstagioParam): AsyncResult<AppException, EstagioEntity>;
  remove(obraId: string, id: string): AsyncResult<AppException, void>;
  reorder(
    obraId: string,
    items: { id: string; posicao: number }[],
  ): AsyncResult<AppException, void>;
  predefinidos(
    tipoObra?: string,
  ): AsyncResult<AppException, { nome: string; posicao: number }[]>;
  createAcompanhamento(
    p: CreateAcompanhamentoParam,
  ): AsyncResult<AppException, EstagioAcompanhamentoEntity>;
  getAcompanhamento(
    obraId: string,
    estagioId: string,
    id: string,
  ): AsyncResult<AppException, EstagioAcompanhamentoEntity>;
  updateAcompanhamento(
    p: UpdateAcompanhamentoParam,
  ): AsyncResult<AppException, EstagioAcompanhamentoEntity>;
  removeAcompanhamento(
    obraId: string,
    estagioId: string,
    id: string,
  ): AsyncResult<AppException, void>;
  createComentario(
    p: CreateComentarioParam,
  ): AsyncResult<AppException, EstagioComentarioEntity>;
  getComentario(
    obraId: string,
    estagioId: string,
    id: string,
  ): AsyncResult<AppException, EstagioComentarioEntity>;
  updateComentario(
    p: UpdateComentarioParam,
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
  createMedicao(
    p: CreateMedicaoParam,
  ): AsyncResult<AppException, MedicaoEntity>;
  listMedicoes(
    obraId: string,
    o: PageOptionsEntity,
  ): AsyncResult<AppException, PageEntity<MedicaoEntity>>;
  getMedicao(
    obraId: string,
    id: string,
  ): AsyncResult<AppException, MedicaoEntity>;
  updateMedicao(p: UpdateMedicaoParam): AsyncResult<AppException, MedicaoEntity>;
  removeMedicao(obraId: string, id: string): AsyncResult<AppException, void>;
  concluir(
    obraId: string,
    id: string,
  ): AsyncResult<AppException, EstagioEntity>;
  duplicar(
    obraId: string,
    id: string,
  ): AsyncResult<AppException, EstagioEntity>;
  assumir(
    obraId: string,
    id: string,
    responsavelUsuarioId: string,
  ): AsyncResult<AppException, EstagioEntity>;
  atual(obraId: string): AsyncResult<AppException, EstagioEntity>;
};
