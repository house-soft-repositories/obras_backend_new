import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import type { Unit } from '@/core/types/unit';
import AlvaraEntity from '@/modules/obras-privadas/domain/entities/alvara.entity';

export type AlvaraUpdate = Partial<ReturnType<AlvaraEntity['toObject']>>;

export default interface IAlvaraRepository {
  save(entity: AlvaraEntity): AsyncResult<AppException, AlvaraEntity>;
  findById(id: string): AsyncResult<AppException, AlvaraEntity | null>;
  findByObraPrivadaId(
    obraPrivadaId: string,
  ): AsyncResult<AppException, AlvaraEntity[]>;
  update(
    id: string,
    props: AlvaraUpdate,
  ): AsyncResult<AppException, AlvaraEntity | null>;
  delete(id: string): AsyncResult<AppException, Unit>;
}
