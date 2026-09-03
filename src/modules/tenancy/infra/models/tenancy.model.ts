import { Column, Entity, Index } from 'typeorm';
import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';

@Entity({ name: 'tenancies', schema: 'public' })
@Index('UQ_tenancies_slug', ['slug'], { unique: true })
@Index('UQ_tenancies_schema_name', ['schemaName'], { unique: true })
export default class TenancyModel extends BaseModelPrimaryColumnUuid {
  @Column()
  name: string;

  @Column()
  slug: string;

  @Column({ type: 'varchar', nullable: true })
  cnpj: string | null;

  @Column({ default: true })
  active: boolean;

  @Column({ name: 'schema_name' })
  schemaName: string;
}
