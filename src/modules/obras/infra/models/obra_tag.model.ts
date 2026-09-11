import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'obra_tag' })
export default class ObraTagModel extends BaseModelPrimaryColumnUuid {
  @Column() tenantId!: string;
  @Column() obraId!: string;
  @Column() tagId!: string;
}
