import { Column, Entity, Index } from 'typeorm';
import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';

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
}
