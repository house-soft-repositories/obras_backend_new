import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import EstagioEntity from '@/modules/cronograma/domain/entities/estagio.entity';
import { ModoDuracao } from '@/modules/cronograma/domain/enums/cronograma.enums';

export type CreatePredefinidosParam = {
  obraId: string;
  autorUsuarioId: string;
};

export type GetPredefinidosParam = {
  obraId: string;
  tipoFinanciamento?: string;
};

export type PredefinidoTemplate = {
  nome: string;
  posicao: number;
  modoDuracao?: ModoDuracao;
};

export type IPredefinidosUseCase = {
  getTemplate(
    p: GetPredefinidosParam,
  ): AsyncResult<AppException, PredefinidoTemplate[]>;
  create(
    p: CreatePredefinidosParam,
  ): AsyncResult<AppException, EstagioEntity[]>;
};

export default IPredefinidosUseCase;
