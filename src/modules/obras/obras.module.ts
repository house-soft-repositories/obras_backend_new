import CoreModule from '@/core/core.module';
import TenantContext from '@/core/multitenancy/tenant_context';
import AuthModule from '@/modules/auth/auth.module';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import IFonteRepository from '@/modules/fontes/adapters/fonte_repository.interface';
import FontesModule from '@/modules/fontes/fontes.module';
import { FONTE_REPOSITORY } from '@/modules/fontes/symbols';
import IObraRepository from '@/modules/obras/adapters/obra_repository.interface';
import CreateObraService from '@/modules/obras/application/create_obra.service';
import ObraController from '@/modules/obras/controller/obra.controller';
import ICreateObraUseCase from '@/modules/obras/domain/usecase/create_obra.usecase';
import ObraModel from '@/modules/obras/infra/models/obra.model';
import {
  ObraOrcamentoModel,
  ObraResponsavelModel,
  ObraSeguidorModel,
} from '@/modules/obras/infra/models/obra_items.model';
import ObraRepository from '@/modules/obras/infra/repositories/obra.repository';
import { CREATE_OBRA_SERVICE, OBRA_REPOSITORY } from '@/modules/obras/symbols';
import PessoasModule from '@/modules/pessoas/pessoas.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
@Module({
  imports: [
    CoreModule,
    AuthModule,
    FontesModule,
    PessoasModule,
    TypeOrmModule.forFeature([
      ObraModel,
      ObraResponsavelModel,
      ObraOrcamentoModel,
      ObraSeguidorModel,
    ]),
  ],
  controllers: [ObraController],
  providers: [
    AccessTokenGuard,
    {
      provide: OBRA_REPOSITORY,
      inject: [DataSource, TenantContext],
      useFactory: (ds: DataSource, tc: TenantContext): IObraRepository =>
        new ObraRepository(ds, tc),
    },
    {
      provide: CREATE_OBRA_SERVICE,
      inject: [OBRA_REPOSITORY, FONTE_REPOSITORY, DataSource, TenantContext],
      useFactory: (
        obra: IObraRepository,
        fonte: IFonteRepository,
        ds: DataSource,
        tc: TenantContext,
      ): ICreateObraUseCase => new CreateObraService(obra, fonte, ds, tc),
    },
  ],
  exports: [OBRA_REPOSITORY, CREATE_OBRA_SERVICE],
})
export default class ObrasModule {}
