import CoreModule from '@/core/core.module';
import ConfigurationService from '@/core/services/configuration.service';
import IPasswordHasher from '@/modules/auth/adapters/password_hasher.interface';
import ITokenService from '@/modules/auth/adapters/token_service.interface';
import IUserSessionRepository from '@/modules/auth/adapters/user_session_repository.interface';
import LoginService from '@/modules/auth/application/login.service';
import RefreshTokenService from '@/modules/auth/application/refresh_token.service';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import AuthController from '@/modules/auth/controller/auth.controller';
import ProvisioningController from '@/modules/auth/controller/provisioning.controller';
import UserProvisioningController from '@/modules/auth/controller/user_provisioning.controller';
import UserRequestContextPipe from '@/modules/auth/controller/user_request_context.pipe';
import ILoginUseCase from '@/modules/auth/domain/usecase/login.usecase';
import IRefreshTokenUseCase from '@/modules/auth/domain/usecase/refresh_token.usecase';
import UserSessionModel from '@/modules/auth/infra/models/user_session.model';
import UserSessionRepository from '@/modules/auth/infra/repositories/user_session.repository';
import JwtTokenService from '@/modules/auth/infra/token/jwt_token.service';
import PasswordModule from '@/modules/auth/password.module';
import {
  LOGIN_SERVICE,
  PASSWORD_HASHER,
  REFRESH_TOKEN_SERVICE,
  TOKEN_SERVICE,
  USER_SESSION_REPOSITORY,
} from '@/modules/auth/symbols';
import TenancyModule from '@/modules/tenancy/tenancy.module';
import IUserRepository from '@/modules/users/adapters/user_repository.interface';
import { USER_REPOSITORY } from '@/modules/users/symbols';
import UsersModule from '@/modules/users/users.module';
import { Module } from '@nestjs/common';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Module({
  imports: [
    CoreModule,
    PasswordModule,
    UsersModule,
    TenancyModule,
    TypeOrmModule.forFeature([UserSessionModel]),
  ],
  controllers: [
    AuthController,
    ProvisioningController,
    UserProvisioningController,
  ],
  providers: [
    {
      provide: TOKEN_SERVICE,
      inject: [ConfigurationService],
      useFactory: (config: ConfigurationService): ITokenService =>
        new JwtTokenService(config),
    },
    AccessTokenGuard,
    UserRequestContextPipe,
    {
      provide: USER_SESSION_REPOSITORY,
      inject: [getRepositoryToken(UserSessionModel)],
      useFactory: (
        repo: Repository<UserSessionModel>,
      ): IUserSessionRepository => new UserSessionRepository(repo),
    },
    {
      provide: LOGIN_SERVICE,
      inject: [
        USER_REPOSITORY,
        PASSWORD_HASHER,
        TOKEN_SERVICE,
        USER_SESSION_REPOSITORY,
      ],
      useFactory: (
        users: IUserRepository,
        passwords: IPasswordHasher,
        tokens: ITokenService,
        sessions: IUserSessionRepository,
      ): ILoginUseCase => new LoginService(users, passwords, tokens, sessions),
    },
    {
      provide: REFRESH_TOKEN_SERVICE,
      inject: [
        USER_REPOSITORY,
        PASSWORD_HASHER,
        TOKEN_SERVICE,
        USER_SESSION_REPOSITORY,
      ],
      useFactory: (
        users: IUserRepository,
        passwords: IPasswordHasher,
        tokens: ITokenService,
        sessions: IUserSessionRepository,
      ): IRefreshTokenUseCase =>
        new RefreshTokenService(users, passwords, tokens, sessions),
    },
  ],
  exports: [TOKEN_SERVICE],
})
export default class AuthModule {}
