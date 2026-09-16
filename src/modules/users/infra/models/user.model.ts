import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';
import TenancyModel from '@/modules/tenancy/infra/models/tenancy.model';

@Entity({ name: 'users', schema: 'public' })
@Index('UQ_users_tenant_email', ['tenantId', 'email'], { unique: true })
export default class UserModel extends BaseModelPrimaryColumnUuid {
  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column()
  role: string;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId: string | null;

  @ManyToOne(() => TenancyModel, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenancy?: TenancyModel | null;

  @Column({ name: 'localidade_id', type: 'uuid', nullable: true })
  localidadeId: string | null;

  @Column({ name: 'orgao_id', type: 'uuid', nullable: true })
  orgaoId: string | null;

  @Column({ name: 'setor_id', type: 'uuid', nullable: true })
  setorId: string | null;
}
