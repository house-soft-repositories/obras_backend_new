import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { validateEnvironmentVariables } from '@/core/config/enviroment.validation';
import ConfigurationService from '@/core/services/configuration.service';
import UserSessionModel from '@/modules/auth/infra/models/user_session.model';
import TenancyModel from '@/modules/tenancy/infra/models/tenancy.model';
import UserModel from '@/modules/users/infra/models/user.model';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
      validate: validateEnvironmentVariables,
    }),
    TypeOrmModule.forRootAsync({
      extraProviders: [ConfigurationService],
      inject: [ConfigurationService],
      useFactory: (config: ConfigurationService) => ({
        type: 'postgres' as const,
        host: config.get('DATABASE_HOST'),
        port: config.get('DATABASE_PORT'),
        username: config.get('DATABASE_USERNAME'),
        password: config.get('DATABASE_PASSWORD'),
        database: config.get('DATABASE_NAME'),
        entities: [TenancyModel, UserModel, UserSessionModel],
        extra: {
          max: config.get('DATABASE_MAX_POOL_CONNECTIONS'),
        },
      }),
    }),
  ],
  providers: [ConfigurationService],
  exports: [ConfigurationService],
})
export default class CoreModule {}
