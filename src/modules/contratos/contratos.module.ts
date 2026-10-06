import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import CoreModule from '@/core/core.module';
import TenantContext from '@/core/multitenancy/tenant_context';
import AuthModule from '@/modules/auth/auth.module';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import {
  ContratoModel,
  ContratoFonteModel,
} from '@/modules/contratos/infra/models/contrato.model';
import {
  AditivoModel,
  AditivoFonteModel,
} from '@/modules/contratos/infra/models/aditivo.model';
import { ParalisacaoModel } from '@/modules/contratos/infra/models/paralisacao.model';
import {
  EmpresaContratadaModel,
  EmpresaContratadaTelefoneModel,
} from '@/modules/contratos/infra/models/empresa_contratada.model';
import ContratoRepository from '@/modules/contratos/infra/repositories/contrato.repository';
import AditivoRepository from '@/modules/contratos/infra/repositories/aditivo.repository';
import ParalisacaoRepository from '@/modules/contratos/infra/repositories/paralisacao.repository';
import EmpresaContratadaRepository from '@/modules/contratos/infra/repositories/empresa_contratada.repository';
import CreateContratoService from '@/modules/contratos/application/create_contrato.service';
import ListContratosService from '@/modules/contratos/application/list_contratos.service';
import GetContratoService from '@/modules/contratos/application/get_contrato.service';
import UpdateContratoService from '@/modules/contratos/application/update_contrato.service';
import DeleteContratoService from '@/modules/contratos/application/delete_contrato.service';
import GetPrazoFinalContratoService from '@/modules/contratos/application/get_prazo_final_contrato.service';
import GetValoresContratoService from '@/modules/contratos/application/get_valores_contrato.service';
import CreateEmpresaContratadaService from '@/modules/contratos/application/create_empresa_contratada.service';
import ListEmpresasContratadasService from '@/modules/contratos/application/list_empresas_contratadas.service';
import GetEmpresaContratadaService from '@/modules/contratos/application/get_empresa_contratada.service';
import UpdateEmpresaContratadaService from '@/modules/contratos/application/update_empresa_contratada.service';
import DeleteEmpresaContratadaService from '@/modules/contratos/application/delete_empresa_contratada.service';
import CreateAditivoService from '@/modules/contratos/application/create_aditivo.service';
import ListAditivosService from '@/modules/contratos/application/list_aditivos.service';
import GetAditivoService from '@/modules/contratos/application/get_aditivo.service';
import DeleteAditivoService from '@/modules/contratos/application/delete_aditivo.service';
import CreateParalisacaoService from '@/modules/contratos/application/create_paralisacao.service';
import ListParalisacoesService from '@/modules/contratos/application/list_paralisacoes.service';
import ReiniciarParalisacaoService from '@/modules/contratos/application/reiniciar_paralisacao.service';
import DeleteParalisacaoService from '@/modules/contratos/application/delete_paralisacao.service';
import ContratosController from '@/modules/contratos/controller/contratos.controller';
import AditivosController from '@/modules/contratos/controller/aditivos.controller';
import ParalisacoesController from '@/modules/contratos/controller/paralisacoes.controller';
import EmpresasContratadasController from '@/modules/contratos/controller/empresas_contratadas.controller';
import {
  CONTRATO_REPOSITORY,
  ADITIVO_REPOSITORY,
  PARALISACAO_REPOSITORY,
  EMPRESA_CONTRATADA_REPOSITORY,
  CREATE_CONTRATO_USE_CASE,
  LIST_CONTRATOS_USE_CASE,
  GET_CONTRATO_USE_CASE,
  UPDATE_CONTRATO_USE_CASE,
  DELETE_CONTRATO_USE_CASE,
  GET_PRAZO_FINAL_CONTRATO_USE_CASE,
  GET_VALORES_CONTRATO_USE_CASE,
  CREATE_EMPRESA_CONTRATADA_USE_CASE,
  LIST_EMPRESAS_CONTRATADAS_USE_CASE,
  GET_EMPRESA_CONTRATADA_USE_CASE,
  UPDATE_EMPRESA_CONTRATADA_USE_CASE,
  DELETE_EMPRESA_CONTRATADA_USE_CASE,
  CREATE_ADITIVO_USE_CASE,
  LIST_ADITIVOS_USE_CASE,
  GET_ADITIVO_USE_CASE,
  DELETE_ADITIVO_USE_CASE,
  CREATE_PARALISACAO_USE_CASE,
  LIST_PARALISACOES_USE_CASE,
  REINICIAR_PARALISACAO_USE_CASE,
  DELETE_PARALISACAO_USE_CASE,
} from '@/modules/contratos/symbols';
import IContratoRepository from '@/modules/contratos/adapters/contrato_repository.interface';
import IAditivoRepository from '@/modules/contratos/adapters/aditivo_repository.interface';
import IParalisacaoRepository from '@/modules/contratos/adapters/paralisacao_repository.interface';
import IEmpresaContratadaRepository from '@/modules/contratos/adapters/empresa_contratada_repository.interface';

@Module({
  imports: [
    CoreModule,
    AuthModule,
    TypeOrmModule.forFeature([
      ContratoModel,
      ContratoFonteModel,
      AditivoModel,
      AditivoFonteModel,
      ParalisacaoModel,
      EmpresaContratadaModel,
      EmpresaContratadaTelefoneModel,
    ]),
  ],
  controllers: [
    ContratosController,
    AditivosController,
    ParalisacoesController,
    EmpresasContratadasController,
  ],
  providers: [
    AccessTokenGuard,
    {
      provide: CONTRATO_REPOSITORY,
      inject: [DataSource, TenantContext],
      useFactory: (ds: DataSource, tc: TenantContext): IContratoRepository =>
        new ContratoRepository(ds, tc),
    },
    {
      provide: ADITIVO_REPOSITORY,
      inject: [DataSource, TenantContext],
      useFactory: (ds: DataSource, tc: TenantContext): IAditivoRepository =>
        new AditivoRepository(ds, tc),
    },
    {
      provide: PARALISACAO_REPOSITORY,
      inject: [DataSource, TenantContext],
      useFactory: (ds: DataSource, tc: TenantContext): IParalisacaoRepository =>
        new ParalisacaoRepository(ds, tc),
    },
    {
      provide: EMPRESA_CONTRATADA_REPOSITORY,
      inject: [DataSource, TenantContext],
      useFactory: (
        ds: DataSource,
        tc: TenantContext,
      ): IEmpresaContratadaRepository =>
        new EmpresaContratadaRepository(ds, tc),
    },
    {
      provide: CREATE_CONTRATO_USE_CASE,
      inject: [CONTRATO_REPOSITORY, EMPRESA_CONTRATADA_REPOSITORY, TenantContext],
      useFactory: (
        cr: IContratoRepository,
        er: IEmpresaContratadaRepository,
        tc: TenantContext,
      ) => new CreateContratoService(cr, er, tc),
    },
    {
      provide: LIST_CONTRATOS_USE_CASE,
      inject: [CONTRATO_REPOSITORY],
      useFactory: (cr: IContratoRepository) => new ListContratosService(cr),
    },
    {
      provide: GET_CONTRATO_USE_CASE,
      inject: [CONTRATO_REPOSITORY],
      useFactory: (cr: IContratoRepository) => new GetContratoService(cr),
    },
    {
      provide: UPDATE_CONTRATO_USE_CASE,
      inject: [CONTRATO_REPOSITORY, EMPRESA_CONTRATADA_REPOSITORY],
      useFactory: (
        cr: IContratoRepository,
        er: IEmpresaContratadaRepository,
      ) => new UpdateContratoService(cr, er),
    },
    {
      provide: DELETE_CONTRATO_USE_CASE,
      inject: [CONTRATO_REPOSITORY],
      useFactory: (cr: IContratoRepository) => new DeleteContratoService(cr),
    },
    {
      provide: GET_PRAZO_FINAL_CONTRATO_USE_CASE,
      inject: [CONTRATO_REPOSITORY, ADITIVO_REPOSITORY, PARALISACAO_REPOSITORY],
      useFactory: (
        cr: IContratoRepository,
        ar: IAditivoRepository,
        pr: IParalisacaoRepository,
      ) => new GetPrazoFinalContratoService(cr, ar, pr),
    },
    {
      provide: GET_VALORES_CONTRATO_USE_CASE,
      inject: [CONTRATO_REPOSITORY, ADITIVO_REPOSITORY],
      useFactory: (cr: IContratoRepository, ar: IAditivoRepository) =>
        new GetValoresContratoService(cr, ar),
    },
    {
      provide: CREATE_EMPRESA_CONTRATADA_USE_CASE,
      inject: [EMPRESA_CONTRATADA_REPOSITORY, TenantContext],
      useFactory: (er: IEmpresaContratadaRepository, tc: TenantContext) =>
        new CreateEmpresaContratadaService(er, tc),
    },
    {
      provide: LIST_EMPRESAS_CONTRATADAS_USE_CASE,
      inject: [EMPRESA_CONTRATADA_REPOSITORY],
      useFactory: (er: IEmpresaContratadaRepository) =>
        new ListEmpresasContratadasService(er),
    },
    {
      provide: GET_EMPRESA_CONTRATADA_USE_CASE,
      inject: [EMPRESA_CONTRATADA_REPOSITORY],
      useFactory: (er: IEmpresaContratadaRepository) =>
        new GetEmpresaContratadaService(er),
    },
    {
      provide: UPDATE_EMPRESA_CONTRATADA_USE_CASE,
      inject: [EMPRESA_CONTRATADA_REPOSITORY],
      useFactory: (er: IEmpresaContratadaRepository) =>
        new UpdateEmpresaContratadaService(er),
    },
    {
      provide: DELETE_EMPRESA_CONTRATADA_USE_CASE,
      inject: [EMPRESA_CONTRATADA_REPOSITORY],
      useFactory: (er: IEmpresaContratadaRepository) =>
        new DeleteEmpresaContratadaService(er),
    },
    {
      provide: CREATE_ADITIVO_USE_CASE,
      inject: [ADITIVO_REPOSITORY, CONTRATO_REPOSITORY, TenantContext],
      useFactory: (
        ar: IAditivoRepository,
        cr: IContratoRepository,
        tc: TenantContext,
      ) => new CreateAditivoService(ar, cr, tc),
    },
    {
      provide: LIST_ADITIVOS_USE_CASE,
      inject: [ADITIVO_REPOSITORY],
      useFactory: (ar: IAditivoRepository) => new ListAditivosService(ar),
    },
    {
      provide: GET_ADITIVO_USE_CASE,
      inject: [ADITIVO_REPOSITORY],
      useFactory: (ar: IAditivoRepository) => new GetAditivoService(ar),
    },
    {
      provide: DELETE_ADITIVO_USE_CASE,
      inject: [ADITIVO_REPOSITORY],
      useFactory: (ar: IAditivoRepository) => new DeleteAditivoService(ar),
    },
    {
      provide: CREATE_PARALISACAO_USE_CASE,
      inject: [PARALISACAO_REPOSITORY, CONTRATO_REPOSITORY, TenantContext],
      useFactory: (
        pr: IParalisacaoRepository,
        cr: IContratoRepository,
        tc: TenantContext,
      ) => new CreateParalisacaoService(pr, cr, tc),
    },
    {
      provide: LIST_PARALISACOES_USE_CASE,
      inject: [PARALISACAO_REPOSITORY],
      useFactory: (pr: IParalisacaoRepository) =>
        new ListParalisacoesService(pr),
    },
    {
      provide: REINICIAR_PARALISACAO_USE_CASE,
      inject: [PARALISACAO_REPOSITORY],
      useFactory: (pr: IParalisacaoRepository) =>
        new ReiniciarParalisacaoService(pr),
    },
    {
      provide: DELETE_PARALISACAO_USE_CASE,
      inject: [PARALISACAO_REPOSITORY],
      useFactory: (pr: IParalisacaoRepository) =>
        new DeleteParalisacaoService(pr),
    },
  ],
  exports: [
    CONTRATO_REPOSITORY,
    ADITIVO_REPOSITORY,
    PARALISACAO_REPOSITORY,
    EMPRESA_CONTRATADA_REPOSITORY,
    CREATE_CONTRATO_USE_CASE,
    LIST_CONTRATOS_USE_CASE,
    GET_CONTRATO_USE_CASE,
    UPDATE_CONTRATO_USE_CASE,
    DELETE_CONTRATO_USE_CASE,
    GET_PRAZO_FINAL_CONTRATO_USE_CASE,
    GET_VALORES_CONTRATO_USE_CASE,
    CREATE_EMPRESA_CONTRATADA_USE_CASE,
    LIST_EMPRESAS_CONTRATADAS_USE_CASE,
    GET_EMPRESA_CONTRATADA_USE_CASE,
    UPDATE_EMPRESA_CONTRATADA_USE_CASE,
    DELETE_EMPRESA_CONTRATADA_USE_CASE,
    CREATE_ADITIVO_USE_CASE,
    LIST_ADITIVOS_USE_CASE,
    GET_ADITIVO_USE_CASE,
    DELETE_ADITIVO_USE_CASE,
    CREATE_PARALISACAO_USE_CASE,
    LIST_PARALISACOES_USE_CASE,
    REINICIAR_PARALISACAO_USE_CASE,
    DELETE_PARALISACAO_USE_CASE,
  ],
})
export default class ContratosModule {}
