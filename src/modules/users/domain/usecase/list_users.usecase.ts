import type UseCase from '@/core/types/use_case';
import UserEntity from '@/modules/users/domain/entities/user.entity';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';

export interface ListUsersParam {
  requester: {
    id: string;
    role: UserRole;
    tenantId: string | null;
  };
}

export class ListUsersResponse {
  constructor(private readonly users: UserEntity[]) {}

  toResponse() {
    return this.users.map((user) => {
      const {
        id,
        name,
        email,
        role,
        tenantId,
        localidadeId,
        orgaoId,
        setorId,
        createdAt,
        updatedAt,
      } = user.toObject();
      return {
        id,
        name,
        email,
        role,
        tenantId,
        localidadeId,
        orgaoId,
        setorId,
        createdAt,
        updatedAt,
      };
    });
  }
}

type IListUsersUseCase = UseCase<ListUsersParam, ListUsersResponse>;

export default IListUsersUseCase;
