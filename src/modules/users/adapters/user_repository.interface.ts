import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import UserEntity from '@/modules/users/domain/entities/user.entity';

export interface FindUserQuery {
  email: string;
  tenantId: string | null;
}

export default interface IUserRepository {
  findOne(query: FindUserQuery): AsyncResult<AppException, UserEntity>;
  findById(id: string): AsyncResult<AppException, UserEntity>;
  save(user: UserEntity): AsyncResult<AppException, UserEntity>;
}
