import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'attachments' })
export default class AttachmentModel extends BaseModelPrimaryColumnUuid {
  @Column({ name: 'file_url' })
  fileUrl: string;

  @Column({ name: 'original_name' })
  originalName: string;

  @Column({ name: 'entity_type' })
  entityType: string;

  @Column({ name: 'entity_id', type: 'uuid' })
  entityId: string;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid' })
  updatedBy: string;
}
