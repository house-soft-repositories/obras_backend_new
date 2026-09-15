import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { ATTACHMENT_ENTITY_TYPE } from '@/modules/attachments/domain/enums/attachment_entity_type.enum';

export default class UploadAttachmentDto {
  @IsEnum(ATTACHMENT_ENTITY_TYPE)
  @IsNotEmpty()
  entityType: ATTACHMENT_ENTITY_TYPE;

  @IsUUID()
  @IsNotEmpty()
  entityId: string;
}
