import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import type { Unit } from '@/core/types/unit';
import ObraPrivadaObservacaoEntity from '@/modules/obras-privadas/domain/entities/obra_privada_observacao.entity';

export default interface IObraPrivadaObservacaoRepository {
  save(
    entity: ObraPrivadaObservacaoEntity,
  ): AsyncResult<AppException, ObraPrivadaObservacaoEntity>;
  findById(
    id: string,
  ): AsyncResult<AppException, ObraPrivadaObservacaoEntity | null>;
  findByObraPrivadaId(
    obraPrivadaId: string,
  ): AsyncResult<AppException, ObraPrivadaObservacaoEntity[]>;
  delete(id: string): AsyncResult<AppException, Unit>;
}
