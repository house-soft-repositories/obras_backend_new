import type UseCase from '@/core/types/use_case';
import type AttachmentEntity from '@/modules/attachments/domain/entities/attachment.entity';
import type BaseFileInterface from '@/modules/attachments/domain/base_file.interface';

export type ReplaceAttachmentParam = {
  id: string;
  file: BaseFileInterface;
  actorId: string;
};

type IReplaceAttachmentUseCase = UseCase<
  ReplaceAttachmentParam,
  AttachmentEntity
>;

export default IReplaceAttachmentUseCase;
