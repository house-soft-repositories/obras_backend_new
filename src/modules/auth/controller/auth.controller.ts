import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import AuthenticatedUser from '@/modules/auth/controller/authenticated_user.decorator';
import UserRequestContextPipe from '@/modules/auth/controller/user_request_context.pipe';
import type ILoginUseCase from '@/modules/auth/domain/usecase/login.usecase';
import type IRefreshTokenUseCase from '@/modules/auth/domain/usecase/refresh_token.usecase';
import LoginDto from '@/modules/auth/dtos/login.dto';
import RefreshTokenDto from '@/modules/auth/dtos/refresh_token.dto';
import { LOGIN_SERVICE, REFRESH_TOKEN_SERVICE } from '@/modules/auth/symbols';
import UserRequestContext from '@/modules/users/dtos/user_request_context.dto';
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
  ) {}
  @Post('login') async loginWithCredentials(@Body() body: LoginDto) {
    return this.unwrap(
      await this.login.execute({ ...body, tenantId: body.tenantId ?? null }),
    );
  }
  @Post('refresh') async refreshTokens(@Body() body: RefreshTokenDto) {
    return this.unwrap(await this.refresh.execute(body));
  }

  @Get('me')
  @UseGuards(AccessTokenGuard)
  me(@AuthenticatedUser(UserRequestContextPipe) user: UserRequestContext) {
    return user;
  }
  private unwrap(result: Awaited<ReturnType<ILoginUseCase['execute']>>) {
    if (result.isLeft())
      throw new HttpException(result.value.message, result.value.statusCode, {
        cause: result.value.cause,
      });
    return result.value;
  }
}
