import { Column, Entity } from 'typeorm';
import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';

@Entity({ name: 'user_sessions', schema: 'public' })
export default class UserSessionModel extends BaseModelPrimaryColumnUuid {
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'refresh_token_hash' })
  refreshTokenHash: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt: Date | null;
}
