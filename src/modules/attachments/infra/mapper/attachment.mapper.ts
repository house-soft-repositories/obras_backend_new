import AttachmentEntity from '@/modules/attachments/domain/entities/attachment.entity';
import { ATTACHMENT_ENTITY_TYPE } from '@/modules/attachments/domain/enums/attachment_entity_type.enum';
import AttachmentModel from '@/modules/attachments/infra/models/attachment.model';

export default abstract class AttachmentMapper {
  static toModel(entity: AttachmentEntity): Partial<AttachmentModel> {
    return {
      id: entity.id,
      fileUrl: entity.fileUrl,
      originalName: entity.originalName,
      entityType: entity.entityType,
      entityId: entity.entityId,
      createdBy: entity.createdBy,
      updatedBy: entity.updatedBy,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toEntity(model: AttachmentModel): AttachmentEntity {
    return AttachmentEntity.fromData({
      id: model.id,
      fileUrl: model.fileUrl,
      originalName: model.originalName,
      entityType: model.entityType as ATTACHMENT_ENTITY_TYPE,
      entityId: model.entityId,
      createdBy: model.createdBy,
      updatedBy: model.updatedBy,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }
}
