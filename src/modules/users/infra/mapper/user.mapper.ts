import UserEntity from '@/modules/users/domain/entities/user.entity';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import UserModel from '@/modules/users/infra/models/user.model';

export default abstract class UserMapper {
  static toModel(entity: UserEntity): Partial<UserModel> {
    return {
      id: entity.id,
      name: entity.name,
      email: entity.email,
      password: entity.password,
      role: entity.role,
      tenantId: entity.tenantId,
      localidadeId: entity.localidadeId,
      orgaoId: entity.orgaoId,
      setorId: entity.setorId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toEntity(model: UserModel): UserEntity {
    return UserEntity.fromData({
      id: model.id,
      name: model.name,
      email: model.email,
      password: model.password,
      role: model.role as UserRole,
      tenantId: model.tenantId,
      localidadeId: model.localidadeId,
      orgaoId: model.orgaoId,
      setorId: model.setorId,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }
}
