import CoreModule from '@/core/core.module';
import TenantContext from '@/core/multitenancy/tenant_context';
import ILocalidadeRepository from '@/modules/localidades/adapters/localidade_repository.interface';
import CreateLocalidadeService from '@/modules/localidades/application/create_localidade.service';
import ListLocalidadesService from '@/modules/localidades/application/list_localidades.service';
import UpdateLocalidadeService from '@/modules/localidades/application/update_localidade.service';
import LocalidadeController from '@/modules/localidades/controller/localidade.controller';
import ICreateLocalidadeUseCase from '@/modules/localidades/domain/usecase/create_localidade.usecase';
import IListLocalidadesUseCase from '@/modules/localidades/domain/usecase/list_localidades.usecase';
import IUpdateLocalidadeUseCase from '@/modules/localidades/domain/usecase/update_localidade.usecase';
import LocalidadeModel from '@/modules/localidades/infra/models/localidade.model';
import LocalidadeRepository from '@/modules/localidades/infra/repositories/localidade.repository';
import {
  CREATE_LOCALIDADE_SERVICE,
  LIST_LOCALIDADES_SERVICE,
  LOCALIDADE_REPOSITORY,
  UPDATE_LOCALIDADE_SERVICE,
} from '@/modules/localidades/symbols';
import AuthModule from '@/modules/auth/auth.module';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Module({
  imports: [CoreModule, AuthModule, TypeOrmModule.forFeature([LocalidadeModel])],
  controllers: [LocalidadeController],
  providers: [
    AccessTokenGuard,
    {
      provide: LOCALIDADE_REPOSITORY,
      inject: [DataSource, TenantContext],
      useFactory: (
        dataSource: DataSource,
        tenantContext: TenantContext,
      ): ILocalidadeRepository =>
        new LocalidadeRepository(dataSource, tenantContext),
    },
    {
      provide: CREATE_LOCALIDADE_SERVICE,
      inject: [LOCALIDADE_REPOSITORY],
      useFactory: (
        repository: ILocalidadeRepository,
      ): ICreateLocalidadeUseCase => new CreateLocalidadeService(repository),
    },
    {
      provide: LIST_LOCALIDADES_SERVICE,
      inject: [LOCALIDADE_REPOSITORY],
      useFactory: (
        repository: ILocalidadeRepository,
      ): IListLocalidadesUseCase => new ListLocalidadesService(repository),
    },
    {
      provide: UPDATE_LOCALIDADE_SERVICE,
      inject: [LOCALIDADE_REPOSITORY],
      useFactory: (
        repository: ILocalidadeRepository,
      ): IUpdateLocalidadeUseCase => new UpdateLocalidadeService(repository),
    },
  ],
  exports: [
    LOCALIDADE_REPOSITORY,
    CREATE_LOCALIDADE_SERVICE,
    LIST_LOCALIDADES_SERVICE,
    UPDATE_LOCALIDADE_SERVICE,
  ],
})
export default class LocalidadesModule {}
