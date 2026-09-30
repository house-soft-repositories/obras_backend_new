import CoreModule from '@/core/core.module';
import TenantContext from '@/core/multitenancy/tenant_context';
import AuthModule from '@/modules/auth/auth.module';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import IFonteRepository from '@/modules/fontes/adapters/fonte_repository.interface';
import CreateFonteService from '@/modules/fontes/application/create_fonte.service';
import DeleteFonteService from '@/modules/fontes/application/delete_fonte.service';
import GetFonteService from '@/modules/fontes/application/get_fonte.service';
import ListFontesService from '@/modules/fontes/application/list_fontes.service';
import UpdateFonteService from '@/modules/fontes/application/update_fonte.service';
import ValidateFonteAtivaService from '@/modules/fontes/application/validate_fonte_ativa.service';
import FonteController from '@/modules/fontes/controller/fonte.controller';
import ICreateFonteUseCase from '@/modules/fontes/domain/usecase/create_fonte.usecase';
import IDeleteFonteUseCase from '@/modules/fontes/domain/usecase/delete_fonte.usecase';
import IGetFonteUseCase from '@/modules/fontes/domain/usecase/get_fonte.usecase';
import IListFontesUseCase from '@/modules/fontes/domain/usecase/list_fontes.usecase';
import IUpdateFonteUseCase from '@/modules/fontes/domain/usecase/update_fonte.usecase';
import IValidateFonteAtivaUseCase from '@/modules/fontes/domain/usecase/validate_fonte_ativa.usecase';
import FonteModel from '@/modules/fontes/infra/models/fonte.model';
import FonteRepository from '@/modules/fontes/infra/repositories/fonte.repository';
import {
  CREATE_FONTE_SERVICE,
  DELETE_FONTE_SERVICE,
  FONTE_REPOSITORY,
  GET_FONTE_SERVICE,
  LIST_FONTES_SERVICE,
  UPDATE_FONTE_SERVICE,
  VALIDATE_FONTE_ATIVA_SERVICE,
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
    {
      provide: GET_FONTE_SERVICE,
      inject: [FONTE_REPOSITORY],
      useFactory: (r: IFonteRepository): IGetFonteUseCase =>
        new GetFonteService(r),
    },
    {
      provide: UPDATE_FONTE_SERVICE,
      inject: [FONTE_REPOSITORY],
      useFactory: (r: IFonteRepository): IUpdateFonteUseCase =>
        new UpdateFonteService(r),
    },
    {
      provide: DELETE_FONTE_SERVICE,
      inject: [FONTE_REPOSITORY],
      useFactory: (r: IFonteRepository): IDeleteFonteUseCase =>
        new DeleteFonteService(r),
    },
    {
      provide: VALIDATE_FONTE_ATIVA_SERVICE,
      inject: [FONTE_REPOSITORY],
      useFactory: (r: IFonteRepository): IValidateFonteAtivaUseCase =>
        new ValidateFonteAtivaService(r),
    },
  ],
  exports: [
    FONTE_REPOSITORY,
    CREATE_FONTE_SERVICE,
    LIST_FONTES_SERVICE,
    GET_FONTE_SERVICE,
    UPDATE_FONTE_SERVICE,
    DELETE_FONTE_SERVICE,
    VALIDATE_FONTE_ATIVA_SERVICE,
  ],
})
export default class FontesModule {}
