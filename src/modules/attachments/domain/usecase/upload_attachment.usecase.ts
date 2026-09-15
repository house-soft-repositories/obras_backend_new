import type UseCase from '@/core/types/use_case';
import type AttachmentEntity from '@/modules/attachments/domain/entities/attachment.entity';
import type BaseFileInterface from '@/modules/attachments/domain/base_file.interface';
import type { ATTACHMENT_ENTITY_TYPE } from '@/modules/attachments/domain/enums/attachment_entity_type.enum';

export type UploadAttachmentParam = {
  file: BaseFileInterface;
  entityType: ATTACHMENT_ENTITY_TYPE;
  entityId: string;
  actorId: string;
};

type IUploadAttachmentUseCase = UseCase<
  UploadAttachmentParam,
  AttachmentEntity
>;

export default IUploadAttachmentUseCase;
