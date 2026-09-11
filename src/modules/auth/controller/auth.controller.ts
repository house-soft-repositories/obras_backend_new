import type AppException from '@/core/exceptions/app_exception';
import type { Either } from '@/core/types/either';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import AuthenticatedUser from '@/modules/auth/controller/authenticated_user.decorator';
import type IGetMeUseCase from '@/modules/auth/domain/usecase/get_me.usecase';
import type ILoginUseCase from '@/modules/auth/domain/usecase/login.usecase';
import type IRefreshTokenUseCase from '@/modules/auth/domain/usecase/refresh_token.usecase';
import type ISwitchTenancyUseCase from '@/modules/auth/domain/usecase/switch_tenancy.usecase';
import LoginDto from '@/modules/auth/dtos/login.dto';
import RefreshTokenDto from '@/modules/auth/dtos/refresh_token.dto';
import SwitchTenancyDto from '@/modules/auth/dtos/switch_tenancy.dto';
import MeMapper from '@/modules/auth/infra/mapper/me.mapper';
import {
  GET_ME_SERVICE,
  LOGIN_SERVICE,
  REFRESH_TOKEN_SERVICE,
  SWITCH_TENANCY_SERVICE,
} from '@/modules/auth/symbols';
import {
  Body,
  Controller,
  Get,
  HttpException,
  Inject,
  Post,
  UseGuards,
} from '@nestjs/common';

@Controller('api/auth')
export default class AuthController {
  constructor(
    @Inject(LOGIN_SERVICE) private readonly login: ILoginUseCase,
    @Inject(REFRESH_TOKEN_SERVICE)
    private readonly refresh: IRefreshTokenUseCase,
    @Inject(SWITCH_TENANCY_SERVICE)
    private readonly switchTenancy: ISwitchTenancyUseCase,
    @Inject(GET_ME_SERVICE) private readonly getMe: IGetMeUseCase,
  ) {}

  @Post('login') async loginWithCredentials(@Body() body: LoginDto) {
    return this.unwrap(
      await this.login.execute({ ...body, tenantId: body.tenantId ?? null }),
    );
  }

  @Post('refresh') async refreshTokens(@Body() body: RefreshTokenDto) {
    return this.unwrap(await this.refresh.execute(body));
  }

  @Post('switch-tenancy')
  @UseGuards(AccessTokenGuard)
  async switchActiveTenancy(
    @Body() body: SwitchTenancyDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    if (!user) throw new HttpException('Unauthorized', 401);
    return this.unwrap(
      await this.switchTenancy.execute({ user, tenantId: body.tenantId }),
    );
  }

  @Get('me')
  @UseGuards(AccessTokenGuard)
  async me(@AuthenticatedUser() payload: AccessTokenPayload | undefined) {
    if (!payload) throw new HttpException('Unauthorized', 401);
    const result = await this.getMe.execute(payload.sub);
    if (result.isLeft()) {
      const status =
        result.value.code === ErrorCodeConstants.USER_NOT_FOUND ? 401 : result.value.statusCode;
      throw new HttpException(result.value.message, status, {
        cause: result.value.cause,
      });
    }
    return MeMapper.toResponse(result.value);
  }

  private unwrap<T>(result: Either<AppException, T>): T {
    if (result.isLeft())
      throw new HttpException(result.value.message, result.value.statusCode, {
        cause: result.value.cause,
      });
    return result.value;
  }
}
