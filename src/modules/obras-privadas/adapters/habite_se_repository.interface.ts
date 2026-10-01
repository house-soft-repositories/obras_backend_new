import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import type { Unit } from '@/core/types/unit';
import HabiteSeEntity from '@/modules/obras-privadas/domain/entities/habite_se.entity';

export type HabiteSeUpdate = Partial<ReturnType<HabiteSeEntity['toObject']>>;
export default interface IHabiteSeRepository {
  save(entity: HabiteSeEntity): AsyncResult<AppException, HabiteSeEntity>;
  findById(id: string): AsyncResult<AppException, HabiteSeEntity | null>;
  findByObraPrivadaId(
    obraPrivadaId: string,
  ): AsyncResult<AppException, HabiteSeEntity[]>;
  update(
    id: string,
    props: HabiteSeUpdate,
  ): AsyncResult<AppException, HabiteSeEntity | null>;
  delete(id: string): AsyncResult<AppException, Unit>;
}
