import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import ITokenService from '@/modules/auth/adapters/token_service.interface';
import ISwitchTenancyUseCase, {
  SwitchTenancyParam,
  SwitchTenancyResponse,
} from '@/modules/auth/domain/usecase/switch_tenancy.usecase';
import AuthServiceException from '@/modules/auth/exceptions/auth_service.exception';
import IListTenanciesUseCase from '@/modules/tenancy/domain/usecase/list_tenancies.usecase';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';

export default class SwitchTenancyService implements ISwitchTenancyUseCase {
  constructor(
    private readonly listTenancies: IListTenanciesUseCase,
    private readonly tokenService: ITokenService,
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
    const accessToken = await this.tokenService.signAccess({
      sub: param.user.sub,
      role: UserRole.SUPERADMIN,
      tenantId: tenancy.id,
    });
    return right({ accessToken, tenancy });
  }
}
