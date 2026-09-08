import UserEntity from '@/modules/users/domain/entities/user.entity';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import UserModel from '@/modules/users/infra/models/user.model';
import { UsuarioWithOrganizationalReadModel } from '@/modules/users/infra/read-models/usuario_with_organizational_read_model';

type UsuarioRow = UserModel & {
  localidadeNome: string | null;
  localidadeUf: string | null;
  orgaoNome: string | null;
  orgaoSigla: string | null;
  setorNome: string | null;
  setorOrgaoId: string | null;
};

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

  static toReadModelWithOrganizational(row: UsuarioRow): UsuarioWithOrganizationalReadModel {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role as UserRole,
      tenantId: row.tenantId,
      localidade:
        row.localidadeId && row.localidadeNome && row.localidadeUf
          ? { id: row.localidadeId, nome: row.localidadeNome, uf: row.localidadeUf }
          : null,
      orgao:
        row.orgaoId && row.orgaoNome
          ? { id: row.orgaoId, nome: row.orgaoNome, sigla: row.orgaoSigla ?? null }
          : null,
      setor:
        row.setorId && row.setorNome && row.setorOrgaoId
          ? { id: row.setorId, nome: row.setorNome, orgaoId: row.setorOrgaoId }
          : null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
