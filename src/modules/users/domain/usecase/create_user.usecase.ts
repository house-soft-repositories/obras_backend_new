import type UseCase from '@/core/types/use_case';
import UserEntity from '@/modules/users/domain/entities/user.entity';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';

export interface VerifiedCreator {
  id: string;
  role: UserRole.ADMIN | UserRole.SUPERADMIN;
  tenantId: string | null;
}

export interface CreateUserParam {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole.STAFF | UserRole.USER;
  tenantId?: string;
  creator: VerifiedCreator;
}

export class CreateUserResponse {
  constructor(private readonly user: UserEntity) {}

  toResponse() {
    const { id, name, email, role, tenantId, createdAt, updatedAt } =
      this.user.toObject();
    return { id, name, email, role, tenantId, createdAt, updatedAt };
  }
}

type ICreateUserUseCase = UseCase<CreateUserParam, CreateUserResponse>;

export default ICreateUserUseCase;
