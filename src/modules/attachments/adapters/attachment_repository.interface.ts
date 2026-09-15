import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import type { Unit } from '@/core/types/unit';
import AttachmentEntity from '@/modules/attachments/domain/entities/attachment.entity';

export default interface IAttachmentRepository {
  save(entity: AttachmentEntity): AsyncResult<AppException, AttachmentEntity>;
  saveMany(
    entities: AttachmentEntity[],
  ): AsyncResult<AppException, AttachmentEntity[]>;
  findById(id: string): AsyncResult<AppException, AttachmentEntity>;
  deleteById(id: string): AsyncResult<AppException, Unit>;
}
