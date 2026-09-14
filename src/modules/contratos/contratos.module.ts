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
import { EmpresaContratadaModel } from '@/modules/contratos/infra/models/empresa_contratada.model';
import ContratoRepository from '@/modules/contratos/infra/repositories/contrato.repository';
import AditivoRepository from '@/modules/contratos/infra/repositories/aditivo.repository';
import ParalisacaoRepository from '@/modules/contratos/infra/repositories/paralisacao.repository';
import EmpresaContratadaRepository from '@/modules/contratos/infra/repositories/empresa_contratada.repository';
import ContratosService from '@/modules/contratos/application/contratos.service';
import AditivosService from '@/modules/contratos/application/aditivos.service';
import ParalisacoesService from '@/modules/contratos/application/paralisacoes.service';
import EmpresasContratadasService from '@/modules/contratos/application/empresas_contratadas.service';
import ContratosController from '@/modules/contratos/controller/contratos.controller';
import AditivosController from '@/modules/contratos/controller/aditivos.controller';
import ParalisacoesController from '@/modules/contratos/controller/paralisacoes.controller';
import EmpresasContratadasController from '@/modules/contratos/controller/empresas_contratadas.controller';
import {
  CONTRATO_REPOSITORY,
  ADITIVO_REPOSITORY,
  PARALISACAO_REPOSITORY,
  EMPRESA_CONTRATADA_REPOSITORY,
  CREATE_CONTRATO_SERVICE,
  LIST_CONTRATOS_SERVICE,
  ADITIVOS_SERVICE,
  PARALISACOES_SERVICE,
  EMPRESAS_CONTRATADAS_SERVICE,
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
      provide: CREATE_CONTRATO_SERVICE,
      inject: [
        CONTRATO_REPOSITORY,
        EMPRESA_CONTRATADA_REPOSITORY,
        ADITIVO_REPOSITORY,
        PARALISACAO_REPOSITORY,
        DataSource,
        TenantContext,
      ],
      useFactory: (
        cr: IContratoRepository,
        er: IEmpresaContratadaRepository,
        ar: IAditivoRepository,
        pr: IParalisacaoRepository,
        ds: DataSource,
        tc: TenantContext,
      ) => new ContratosService(cr, er, ar, pr, ds, tc),
    },
    {
      provide: LIST_CONTRATOS_SERVICE,
      inject: [
        CONTRATO_REPOSITORY,
        EMPRESA_CONTRATADA_REPOSITORY,
        ADITIVO_REPOSITORY,
        PARALISACAO_REPOSITORY,
        DataSource,
        TenantContext,
      ],
      useFactory: (
        cr: IContratoRepository,
        er: IEmpresaContratadaRepository,
        ar: IAditivoRepository,
        pr: IParalisacaoRepository,
        ds: DataSource,
        tc: TenantContext,
      ) => new ContratosService(cr, er, ar, pr, ds, tc),
    },
    {
      provide: ADITIVOS_SERVICE,
      inject: [ADITIVO_REPOSITORY, CONTRATO_REPOSITORY, TenantContext],
      useFactory: (
        ar: IAditivoRepository,
        cr: IContratoRepository,
        tc: TenantContext,
      ) => new AditivosService(ar, cr, tc),
    },
    {
      provide: PARALISACOES_SERVICE,
      inject: [PARALISACAO_REPOSITORY, CONTRATO_REPOSITORY, TenantContext],
      useFactory: (
        pr: IParalisacaoRepository,
        cr: IContratoRepository,
        tc: TenantContext,
      ) => new ParalisacoesService(pr, cr, tc),
    },
    {
      provide: EMPRESAS_CONTRATADAS_SERVICE,
      inject: [EMPRESA_CONTRATADA_REPOSITORY, TenantContext],
      useFactory: (er: IEmpresaContratadaRepository, tc: TenantContext) =>
        new EmpresasContratadasService(er, tc),
    },
  ],
  exports: [
    CONTRATO_REPOSITORY,
    ADITIVO_REPOSITORY,
    PARALISACAO_REPOSITORY,
    EMPRESA_CONTRATADA_REPOSITORY,
    CREATE_CONTRATO_SERVICE,
    LIST_CONTRATOS_SERVICE,
    ADITIVOS_SERVICE,
    PARALISACOES_SERVICE,
    EMPRESAS_CONTRATADAS_SERVICE,
  ],
})
export default class ContratosModule {}
