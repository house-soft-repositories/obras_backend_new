import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import EstagioComentarioEntity from '@/modules/cronograma/domain/entities/estagio_comentario.entity';
import type { Unit } from '@/core/types/unit';

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

export type ListComentariosParam = {
  obraId: string;
  estagioId: string;
};

export type IComentariosUseCase = {
  create(
    p: CreateComentarioParam,
  ): AsyncResult<AppException, EstagioComentarioEntity>;
  get(
    obraId: string,
    estagioId: string,
    id: string,
  ): AsyncResult<AppException, EstagioComentarioEntity>;
  list(
    p: ListComentariosParam,
  ): AsyncResult<AppException, EstagioComentarioEntity[]>;
  update(
    p: UpdateComentarioParam,
  ): AsyncResult<AppException, EstagioComentarioEntity>;
  remove(
    obraId: string,
    estagioId: string,
    id: string,
  ): AsyncResult<AppException, Unit>;
};

export default IComentariosUseCase;
