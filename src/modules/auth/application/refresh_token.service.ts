import { randomUUID } from 'node:crypto';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IPasswordHasher from '@/modules/auth/adapters/password_hasher.interface';
import ITokenService from '@/modules/auth/adapters/token_service.interface';
import IUserSessionRepository from '@/modules/auth/adapters/user_session_repository.interface';
import UserSessionEntity from '@/modules/auth/domain/entities/user_session.entity';
import { TokenPairResponse } from '@/modules/auth/domain/usecase/login.usecase';
import IRefreshTokenUseCase, {
  RefreshTokenParam,
} from '@/modules/auth/domain/usecase/refresh_token.usecase';
import AuthServiceException from '@/modules/auth/exceptions/auth_service.exception';
import AuthTokenException from '@/modules/auth/exceptions/auth_token.exception';
import IUserRepository from '@/modules/users/adapters/user_repository.interface';

export default class RefreshTokenService implements IRefreshTokenUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService,
    private readonly sessionRepository: IUserSessionRepository,
  ) {}

  async execute(param: RefreshTokenParam): AsyncResult<AppException, TokenPairResponse> {
    try {
      const payload = await this.tokenService.verifyRefresh(param.refreshToken);
      const session = await this.sessionRepository.findActiveById(payload.sid);
      if (session.isLeft()) return left(this.invalidRefreshToken());

      const matches = await this.passwordHasher.compare(param.refreshToken, session.value.refreshTokenHash);
      if (!matches) return left(this.invalidRefreshToken());

      const user = await this.userRepository.findById(session.value.userId);
      if (user.isLeft()) return left(this.invalidRefreshToken());

      const revoke = await this.sessionRepository.revoke(session.value.id);
      if (revoke.isLeft()) return left(revoke.value);

      const nextSessionId = randomUUID();
      const refreshToken = await this.tokenService.signRefresh({
        sub: user.value.id,
        sid: nextSessionId,
        tenantId: payload.tenantId,
      });
      const refreshTokenHash = await this.passwordHasher.hash(refreshToken);
      const saved = await this.sessionRepository.save(
        UserSessionEntity.create({
          id: nextSessionId,
          userId: user.value.id,
          refreshTokenHash,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }),
      );
      if (saved.isLeft()) return left(saved.value);

      const accessToken = await this.tokenService.signAccess({
        sub: user.value.id,
        role: user.value.role,
        tenantId: payload.tenantId,
      });
      return right({ accessToken, refreshToken });
    } catch (error) {
      if (error instanceof AuthTokenException) {
        return left(this.invalidRefreshToken());
      }
      return left(
        new AuthServiceException({
          code: ErrorCodeConstants.AUTH_REFRESH_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }

  private invalidRefreshToken(): AuthServiceException {
    return new AuthServiceException({
      code: ErrorCodeConstants.AUTH_INVALID_REFRESH_TOKEN,
      statusCode: 401,
    });
  }
}
