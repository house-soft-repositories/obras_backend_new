import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import CoreModule from '@/core/core.module';
import AuthModule from '@/modules/auth/auth.module';
import TenantContext from '@/core/multitenancy/tenant_context';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import EstagiosController from '@/modules/cronograma/controller/estagios.controller';
import EstagiosService from '@/modules/cronograma/application/estagios.service';
import EstagioRepository from '@/modules/cronograma/infra/repositories/estagio.repository';
import IEstagioRepository from '@/modules/cronograma/adapters/estagio_repository.interface';
import {
  ESTAGIO_REPOSITORY,
  ESTAGIOS_SERVICE,
} from '@/modules/cronograma/symbols';
import IObraRepository from '@/modules/obras/adapters/obra_repository.interface';
import ObraRepository from '@/modules/obras/infra/repositories/obra.repository';
import { OBRA_REPOSITORY } from '@/modules/obras/symbols';
@Module({
  imports: [CoreModule, AuthModule],
  controllers: [EstagiosController],
  providers: [
    AccessTokenGuard,
    {
      provide: OBRA_REPOSITORY,
      inject: [DataSource, TenantContext],
      useFactory: (ds: DataSource, tc: TenantContext) =>
        new ObraRepository(ds, tc) as IObraRepository,
    },
    {
      provide: ESTAGIO_REPOSITORY,
      inject: [DataSource, TenantContext],
      useFactory: (ds: DataSource, tc: TenantContext) =>
        new EstagioRepository(ds, tc) as IEstagioRepository,
    },
    {
      provide: ESTAGIOS_SERVICE,
      inject: [ESTAGIO_REPOSITORY, TenantContext, OBRA_REPOSITORY],
      useFactory: (
        r: IEstagioRepository,
        tc: TenantContext,
        o: IObraRepository,
      ) => new EstagiosService(r, tc, o),
    },
  ],
  exports: [ESTAGIOS_SERVICE],
})
export default class CronogramaModule {}
