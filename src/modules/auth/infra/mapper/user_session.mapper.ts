import UserSessionEntity from '@/modules/auth/domain/entities/user_session.entity';
import UserSessionModel from '@/modules/auth/infra/models/user_session.model';

export default abstract class UserSessionMapper {
  static toModel(entity: UserSessionEntity): Partial<UserSessionModel> {
    return {
      id: entity.id,
      userId: entity.userId,
      refreshTokenHash: entity.refreshTokenHash,
      expiresAt: entity.expiresAt,
      revokedAt: entity.revokedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toEntity(model: UserSessionModel): UserSessionEntity {
    return UserSessionEntity.fromData({
      id: model.id,
      userId: model.userId,
      refreshTokenHash: model.refreshTokenHash,
      expiresAt: model.expiresAt,
      revokedAt: model.revokedAt,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }
}
