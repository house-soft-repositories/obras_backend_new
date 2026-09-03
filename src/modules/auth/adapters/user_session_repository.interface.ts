import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import UserSessionEntity from '@/modules/auth/domain/entities/user_session.entity';

export default interface IUserSessionRepository {
  save(session: UserSessionEntity): AsyncResult<AppException, UserSessionEntity>;
  findActiveById(id: string): AsyncResult<AppException, UserSessionEntity>;
  revoke(id: string): AsyncResult<AppException, void>;
}
