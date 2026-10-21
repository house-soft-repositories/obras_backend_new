import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import EstagioAcompanhamentoEntity from '@/modules/cronograma/domain/entities/estagio_acompanhamento.entity';
import type { Unit } from '@/core/types/unit';

export default interface IAcompanhamentoRepository {
  save(
    item: EstagioAcompanhamentoEntity,
  ): AsyncResult<AppException, EstagioAcompanhamentoEntity>;
  findById(
    obraId: string,
    estagioId: string,
    id: string,
  ): AsyncResult<AppException, EstagioAcompanhamentoEntity>;
  list(
    obraId: string,
    estagioId: string,
  ): AsyncResult<AppException, EstagioAcompanhamentoEntity[]>;
  update(
    item: EstagioAcompanhamentoEntity,
  ): AsyncResult<AppException, EstagioAcompanhamentoEntity>;
  remove(
    obraId: string,
    estagioId: string,
    id: string,
  ): AsyncResult<AppException, Unit>;
}
