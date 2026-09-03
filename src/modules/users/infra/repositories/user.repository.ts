import { Repository } from 'typeorm';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IUserRepository, { FindUserQuery } from '@/modules/users/adapters/user_repository.interface';
import UserEntity from '@/modules/users/domain/entities/user.entity';
import UserRepositoryException from '@/modules/users/exceptions/user_repository.exception';
import UserMapper from '@/modules/users/infra/mapper/user.mapper';
import UserModel from '@/modules/users/infra/models/user.model';

export default class UserRepository implements IUserRepository {
  constructor(private readonly repository: Repository<UserModel>) {}

  async findOne(query: FindUserQuery): AsyncResult<AppException, UserEntity> {
    try {
      const builder = this.repository
        .createQueryBuilder('user')
        .where('user.email = :email', { email: query.email.toLowerCase() });

      if (query.tenantId === null) {
        builder.andWhere('user.tenant_id IS NULL');
      } else {
        builder.andWhere('user.tenant_id = :tenantId', { tenantId: query.tenantId });
      }

      const model = await builder.getOne();
      if (!model) {
        return left(
          new UserRepositoryException({
            code: ErrorCodeConstants.USER_NOT_FOUND,
            statusCode: 404,
          }),
        );
      }
      return right(UserMapper.toEntity(model));
    } catch (error) {
      return left(
        new UserRepositoryException({
          code: ErrorCodeConstants.USER_REPOSITORY_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }

  async findById(id: string): AsyncResult<AppException, UserEntity> {
    try {
      const model = await this.repository.findOne({ where: { id } });
      if (!model) {
        return left(
          new UserRepositoryException({
            code: ErrorCodeConstants.USER_NOT_FOUND,
            statusCode: 404,
          }),
        );
      }
      return right(UserMapper.toEntity(model));
    } catch (error) {
      return left(
        new UserRepositoryException({
          code: ErrorCodeConstants.USER_REPOSITORY_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }

  async save(user: UserEntity): AsyncResult<AppException, UserEntity> {
    try {
      const saved = await this.repository.save(this.repository.create(UserMapper.toModel(user)));
      return right(UserMapper.toEntity(saved));
    } catch (error) {
      return left(
        new UserRepositoryException({
          code: ErrorCodeConstants.USER_REPOSITORY_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }
}
