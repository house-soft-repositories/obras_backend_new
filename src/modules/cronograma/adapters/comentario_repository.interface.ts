import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import EstagioComentarioEntity from '@/modules/cronograma/domain/entities/estagio_comentario.entity';
import type { Unit } from '@/core/types/unit';

export default interface IComentarioRepository {
  save(
    item: EstagioComentarioEntity,
  ): AsyncResult<AppException, EstagioComentarioEntity>;
  findById(
    obraId: string,
    estagioId: string,
    id: string,
  ): AsyncResult<AppException, EstagioComentarioEntity>;
  list(
    obraId: string,
    estagioId: string,
  ): AsyncResult<AppException, EstagioComentarioEntity[]>;
  update(
    item: EstagioComentarioEntity,
  ): AsyncResult<AppException, EstagioComentarioEntity>;
  remove(
    obraId: string,
    estagioId: string,
    id: string,
  ): AsyncResult<AppException, Unit>;
}
