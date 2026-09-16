import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';
import ObraModel from '@/modules/obras/infra/models/obra.model';
import TagModel from '@/modules/obras/infra/models/tag.model';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity({ name: 'obra_tag' })
export default class ObraTagModel extends BaseModelPrimaryColumnUuid {
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId!: string;
  @Column({ name: 'obra_id', type: 'uuid' }) obraId!: string;
  @ManyToOne(() => ObraModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'obra_id' })
  obra?: ObraModel;
  @Column({ name: 'tag_id', type: 'uuid' }) tagId!: string;
  @ManyToOne(() => TagModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tag_id' })
  tag?: TagModel;
}
