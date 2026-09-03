import { randomUUID } from 'node:crypto';

export interface UserSessionProps {
  id: string;
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export default class UserSessionEntity {
  private constructor(private readonly props: UserSessionProps) {}

  static create({
    id = randomUUID(),
    userId,
    refreshTokenHash,
    expiresAt,
  }: Pick<UserSessionProps, 'userId' | 'refreshTokenHash' | 'expiresAt'> & { id?: string }): UserSessionEntity {
    const now = new Date();
    return new UserSessionEntity({
      id,
      userId,
      refreshTokenHash,
      expiresAt,
      revokedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromData(props: UserSessionProps): UserSessionEntity {
    return new UserSessionEntity(props);
  }

  get id() { return this.props.id; }
  get userId() { return this.props.userId; }
  get refreshTokenHash() { return this.props.refreshTokenHash; }
  get expiresAt() { return this.props.expiresAt; }
  get revokedAt() { return this.props.revokedAt; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }
}
