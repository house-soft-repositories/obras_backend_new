import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import EstagioEntity from '@/modules/cronograma/domain/entities/estagio.entity';
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
};
