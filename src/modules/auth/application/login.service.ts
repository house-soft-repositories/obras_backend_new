import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IPasswordHasher from '@/modules/auth/adapters/password_hasher.interface';
import ITokenService from '@/modules/auth/adapters/token_service.interface';
import IUserSessionRepository from '@/modules/auth/adapters/user_session_repository.interface';
import UserSessionEntity from '@/modules/auth/domain/entities/user_session.entity';
import ILoginUseCase, {
  LoginParam,
  TokenPairResponse,
} from '@/modules/auth/domain/usecase/login.usecase';
import AuthServiceException from '@/modules/auth/exceptions/auth_service.exception';
import IUserRepository from '@/modules/users/adapters/user_repository.interface';
import { randomUUID } from 'node:crypto';

export default class LoginService implements ILoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService,
    private readonly sessionRepository: IUserSessionRepository,
  ) {}

  async execute(
    param: LoginParam,
  ): AsyncResult<AppException, TokenPairResponse> {
    try {
      const user = await this.userRepository.findOne({
        email: param.email,
        tenantId: param.tenantId,
      });
      if (user.isLeft()) {
        return left(this.invalidCredentials());
      }

      const passwordMatches = await this.passwordHasher.compare(
        param.password,
        user.value.password,
      );
      if (!passwordMatches) return left(this.invalidCredentials());

      const sessionId = randomUUID();
      const refreshToken = await this.tokenService.signRefresh({
        sub: user.value.id,
        sid: sessionId,
        tenantId: user.value.tenantId,
      });
      const refreshTokenHash = await this.passwordHasher.hash(refreshToken);
      const session = UserSessionEntity.create({
        id: sessionId,
        userId: user.value.id,
        refreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      const saved = await this.sessionRepository.save(session);
      if (saved.isLeft()) return left(saved.value);

      const accessToken = await this.tokenService.signAccess({
        sub: user.value.id,
        role: user.value.role,
        tenantId: user.value.tenantId,
      });
      return right({ accessToken, refreshToken });
    } catch (error) {
      return left(
        new AuthServiceException({
          code: ErrorCodeConstants.AUTH_LOGIN_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }

  private invalidCredentials(): AuthServiceException {
    return new AuthServiceException({
      code: ErrorCodeConstants.AUTH_INVALID_CREDENTIALS,
      statusCode: 401,
    });
  }
}
