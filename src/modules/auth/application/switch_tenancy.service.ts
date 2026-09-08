import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import ITokenService from '@/modules/auth/adapters/token_service.interface';
import IPasswordHasher from '@/modules/auth/adapters/password_hasher.interface';
import IUserSessionRepository from '@/modules/auth/adapters/user_session_repository.interface';
import UserSessionEntity from '@/modules/auth/domain/entities/user_session.entity';
import ISwitchTenancyUseCase, {
  SwitchTenancyParam,
  SwitchTenancyResponse,
} from '@/modules/auth/domain/usecase/switch_tenancy.usecase';
import AuthServiceException from '@/modules/auth/exceptions/auth_service.exception';
import IListTenanciesUseCase from '@/modules/tenancy/domain/usecase/list_tenancies.usecase';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import { randomUUID } from 'node:crypto';

export default class SwitchTenancyService implements ISwitchTenancyUseCase {
  constructor(
    private readonly listTenancies: IListTenanciesUseCase,
    private readonly tokenService: ITokenService,
    private readonly passwordHasher: IPasswordHasher,
    private readonly sessionRepository: IUserSessionRepository,
  ) {}

  async execute(
    param: SwitchTenancyParam,
  ): AsyncResult<AppException, SwitchTenancyResponse> {
    if (param.user.role !== UserRole.SUPERADMIN) {
      return left(
        new AuthServiceException({
          code: ErrorCodeConstants.AUTH_TENANCY_SWITCH_FORBIDDEN,
          statusCode: 403,
        }),
      );
    }
    const tenancies = await this.listTenancies.execute({
      role: param.user.role,
    });
    if (tenancies.isLeft()) return left(tenancies.value);
    const tenancy = tenancies.value.find(({ id }) => id === param.tenantId);
    if (!tenancy || !tenancy.active) {
      return left(
        new AuthServiceException({
          code: ErrorCodeConstants.AUTH_TENANCY_SWITCH_UNAVAILABLE,
          statusCode: 404,
        }),
      );
    }
    const sessionId = randomUUID();
    const refreshToken = await this.tokenService.signRefresh({
      sub: param.user.sub,
      sid: sessionId,
      tenantId: tenancy.id,
    });
    const refreshTokenHash = await this.passwordHasher.hash(refreshToken);
    const session = UserSessionEntity.create({
      id: sessionId,
      userId: param.user.sub,
      refreshTokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    const saved = await this.sessionRepository.save(session);
    if (saved.isLeft()) return left(saved.value);

    const accessToken = await this.tokenService.signAccess({
      sub: param.user.sub,
      role: UserRole.SUPERADMIN,
      tenantId: tenancy.id,
    });
    return right({ accessToken, refreshToken, tenancy });
  }
}
