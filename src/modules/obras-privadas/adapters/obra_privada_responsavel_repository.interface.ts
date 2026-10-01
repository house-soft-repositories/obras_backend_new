import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import type { Unit } from '@/core/types/unit';
import ObraPrivadaResponsavelEntity from '@/modules/obras-privadas/domain/entities/obra_privada_responsavel.entity';
export type ObraPrivadaResponsavelUpdate = Partial<
  ReturnType<ObraPrivadaResponsavelEntity['toObject']>
>;
export default interface IObraPrivadaResponsavelRepository {
  save(
    entity: ObraPrivadaResponsavelEntity,
  ): AsyncResult<AppException, ObraPrivadaResponsavelEntity>;
  findById(
    id: string,
  ): AsyncResult<AppException, ObraPrivadaResponsavelEntity | null>;
  findByObraPrivadaId(
    obraPrivadaId: string,
  ): AsyncResult<AppException, ObraPrivadaResponsavelEntity[]>;
  update(
    id: string,
    props: ObraPrivadaResponsavelUpdate,
  ): AsyncResult<AppException, ObraPrivadaResponsavelEntity | null>;
  delete(id: string): AsyncResult<AppException, Unit>;
}
