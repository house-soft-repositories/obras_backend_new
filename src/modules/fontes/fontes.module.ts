import CoreModule from '@/core/core.module';
import TenantContext from '@/core/multitenancy/tenant_context';
import AuthModule from '@/modules/auth/auth.module';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import IFonteRepository from '@/modules/fontes/adapters/fonte_repository.interface';
import CreateFonteService from '@/modules/fontes/application/create_fonte.service';
import ListFontesService from '@/modules/fontes/application/list_fontes.service';
import FonteController from '@/modules/fontes/controller/fonte.controller';
import ICreateFonteUseCase from '@/modules/fontes/domain/usecase/create_fonte.usecase';
import IListFontesUseCase from '@/modules/fontes/domain/usecase/list_fontes.usecase';
import FonteModel from '@/modules/fontes/infra/models/fonte.model';
import FonteRepository from '@/modules/fontes/infra/repositories/fonte.repository';
import {
  CREATE_FONTE_SERVICE,
  FONTE_REPOSITORY,
  LIST_FONTES_SERVICE,
} from '@/modules/fontes/symbols';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
@Module({
  imports: [CoreModule, AuthModule, TypeOrmModule.forFeature([FonteModel])],
  controllers: [FonteController],
  providers: [
    AccessTokenGuard,
    {
      provide: FONTE_REPOSITORY,
      inject: [DataSource, TenantContext],
      useFactory: (ds: DataSource, tc: TenantContext): IFonteRepository =>
        new FonteRepository(ds, tc),
    },
    {
      provide: CREATE_FONTE_SERVICE,
      inject: [FONTE_REPOSITORY],
      useFactory: (r: IFonteRepository): ICreateFonteUseCase =>
        new CreateFonteService(r),
    },
    {
      provide: LIST_FONTES_SERVICE,
      inject: [FONTE_REPOSITORY],
      useFactory: (r: IFonteRepository): IListFontesUseCase =>
        new ListFontesService(r),
    },
  ],
  exports: [FONTE_REPOSITORY, CREATE_FONTE_SERVICE, LIST_FONTES_SERVICE],
})
export default class FontesModule {}
