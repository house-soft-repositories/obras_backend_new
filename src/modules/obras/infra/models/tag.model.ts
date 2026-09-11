import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'tag' })
export default class TagModel extends BaseModelPrimaryColumnUuid {
  @Column() tenantId!: string;
  @Column() nome!: string;
}
