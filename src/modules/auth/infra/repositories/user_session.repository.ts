import { Repository } from 'typeorm';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IUserSessionRepository from '@/modules/auth/adapters/user_session_repository.interface';
import UserSessionEntity from '@/modules/auth/domain/entities/user_session.entity';
import AuthSessionRepositoryException from '@/modules/auth/exceptions/auth_session_repository.exception';
import UserSessionMapper from '@/modules/auth/infra/mapper/user_session.mapper';
import UserSessionModel from '@/modules/auth/infra/models/user_session.model';

export default class UserSessionRepository implements IUserSessionRepository {
  constructor(private readonly repository: Repository<UserSessionModel>) {}

  async save(session: UserSessionEntity): AsyncResult<AppException, UserSessionEntity> {
    try {
      const model = this.repository.create(UserSessionMapper.toModel(session));
      return right(UserSessionMapper.toEntity(await this.repository.save(model)));
    } catch (error) {
      return left(this.failure(error));
    }
  }

  async findActiveById(id: string): AsyncResult<AppException, UserSessionEntity> {
    try {
      const model = await this.repository
        .createQueryBuilder('session')
        .where('session.id = :id', { id })
        .andWhere('session.revoked_at IS NULL')
        .andWhere('session.expires_at > NOW()')
        .getOne();
      if (!model) {
        return left(
          new AuthSessionRepositoryException({
            code: ErrorCodeConstants.AUTH_SESSION_NOT_FOUND,
            statusCode: 404,
          }),
        );
      }
      return right(UserSessionMapper.toEntity(model));
    } catch (error) {
      return left(this.failure(error));
    }
  }

  async revoke(id: string): AsyncResult<AppException, void> {
    try {
      await this.repository
        .createQueryBuilder()
        .update(UserSessionModel)
        .set({ revokedAt: new Date() })
        .where('id = :id', { id })
        .execute();
      return right(undefined);
    } catch (error) {
      return left(this.failure(error));
    }
  }

  private failure(cause: unknown): AuthSessionRepositoryException {
    return new AuthSessionRepositoryException({
      code: ErrorCodeConstants.AUTH_SESSION_REPOSITORY_FAILED,
      statusCode: 500,
      cause,
    });
  }
}
