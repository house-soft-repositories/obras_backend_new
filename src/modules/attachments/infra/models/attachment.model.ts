import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';
import UserModel from '@/modules/users/infra/models/user.model';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

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

  @ManyToOne(() => UserModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'created_by' })
  createdByUser?: UserModel;

  @Column({ name: 'updated_by', type: 'uuid' })
  updatedBy: string;

  @ManyToOne(() => UserModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'updated_by' })
  updatedByUser?: UserModel;
}
