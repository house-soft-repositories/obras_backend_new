import AttachmentEntity from '@/modules/attachments/domain/entities/attachment.entity';

export default class AttachmentResponseDto {
  id: string;
  fileUrl: string;
  originalName: string;
  entityType: string;
  entityId: string;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: AttachmentEntity): AttachmentResponseDto {
    const dto = new AttachmentResponseDto();
    dto.id = entity.id;
    dto.fileUrl = entity.fileUrl;
    dto.originalName = entity.originalName;
    dto.entityType = entity.entityType;
    dto.entityId = entity.entityId;
    dto.createdBy = entity.createdBy;
    dto.updatedBy = entity.updatedBy;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
