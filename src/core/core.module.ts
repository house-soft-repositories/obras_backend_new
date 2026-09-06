import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { validateEnvironmentVariables } from '@/core/config/enviroment.validation';
import ConfigurationService from '@/core/services/configuration.service';
import UserSessionModel from '@/modules/auth/infra/models/user_session.model';
import TenancyModel from '@/modules/tenancy/infra/models/tenancy.model';
import UserModel from '@/modules/users/infra/models/user.model';
import TenantContext from '@/core/multitenancy/tenant_context';
import TenantSchemaResolver from '@/core/multitenancy/tenant_schema_resolver';
import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';

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
  providers: [
    ConfigurationService,
    TenantContext,
    {
      provide: TenantSchemaResolver,
      inject: [DataSource],
      useFactory: (dataSource: DataSource) => new TenantSchemaResolver(dataSource),
    },
    {
      provide: TenantRequestContextService,
      inject: [TenantSchemaResolver, TenantContext],
      useFactory: (
        resolver: TenantSchemaResolver,
        context: TenantContext,
      ) => new TenantRequestContextService(resolver, context),
    },
  ],
  exports: [
    ConfigurationService,
    TenantContext,
    TenantSchemaResolver,
    TenantRequestContextService,
  ],
})
export default class CoreModule {}
