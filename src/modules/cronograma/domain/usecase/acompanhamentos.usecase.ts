import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import EstagioAcompanhamentoEntity from '@/modules/cronograma/domain/entities/estagio_acompanhamento.entity';
import type { Unit } from '@/core/types/unit';

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

export type ListAcompanhamentosParam = {
  obraId: string;
  estagioId: string;
};

export type IAcompanhamentosUseCase = {
  create(
    p: CreateAcompanhamentoParam,
  ): AsyncResult<AppException, EstagioAcompanhamentoEntity>;
  get(
    obraId: string,
    estagioId: string,
    id: string,
  ): AsyncResult<AppException, EstagioAcompanhamentoEntity>;
  list(
    p: ListAcompanhamentosParam,
  ): AsyncResult<AppException, EstagioAcompanhamentoEntity[]>;
  update(
    p: UpdateAcompanhamentoParam,
  ): AsyncResult<AppException, EstagioAcompanhamentoEntity>;
  remove(
    obraId: string,
    estagioId: string,
    id: string,
  ): AsyncResult<AppException, Unit>;
};

export default IAcompanhamentosUseCase;
