import CoreModule from '@/core/core.module';
import TenantContext from '@/core/multitenancy/tenant_context';
import AuthModule from '@/modules/auth/auth.module';
import IOrgaoRepository from '@/modules/orgaos/adapters/orgao_repository.interface';
import ISetorRepository from '@/modules/orgaos/adapters/setor_repository.interface';
import CreateOrgaoService from '@/modules/orgaos/application/create_orgao.service';
import CreateSetorService from '@/modules/orgaos/application/create_setor.service';
import ListOrgaosByLocalidadeService from '@/modules/orgaos/application/list_orgaos_by_localidade.service';
import ListOrgaosService from '@/modules/orgaos/application/list_orgaos.service';
import ListSetoresService from '@/modules/orgaos/application/list_setores.service';
import ListSetoresByOrgaoService from '@/modules/orgaos/application/list_setores_by_orgao.service';
import UpdateOrgaoService from '@/modules/orgaos/application/update_orgao.service';
import UpdateSetorService from '@/modules/orgaos/application/update_setor.service';
import OrgaoController from '@/modules/orgaos/controller/orgao.controller';
import ICreateOrgaoUseCase from '@/modules/orgaos/domain/usecase/create_orgao.usecase';
import ICreateSetorUseCase from '@/modules/orgaos/domain/usecase/create_setor.usecase';
import IListOrgaosByLocalidadeUseCase from '@/modules/orgaos/domain/usecase/list_orgaos_by_localidade.usecase';
import IListOrgaosUseCase from '@/modules/orgaos/domain/usecase/list_orgaos.usecase';
import IListSetoresUseCase from '@/modules/orgaos/domain/usecase/list_setores.usecase';
import IListSetoresByOrgaoUseCase from '@/modules/orgaos/domain/usecase/list_setores_by_orgao.usecase';
import IUpdateOrgaoUseCase from '@/modules/orgaos/domain/usecase/update_orgao.usecase';
import IUpdateSetorUseCase from '@/modules/orgaos/domain/usecase/update_setor.usecase';
import OrgaoModel from '@/modules/orgaos/infra/models/orgao.model';
import SetorModel from '@/modules/orgaos/infra/models/setor.model';
import OrgaoRepository from '@/modules/orgaos/infra/repositories/orgao.repository';
import SetorRepository from '@/modules/orgaos/infra/repositories/setor.repository';
import {
  CREATE_ORGAO_SERVICE,
  CREATE_SETOR_SERVICE,
  LIST_ORGAOS_BY_LOCALIDADE_SERVICE,
  LIST_ORGAOS_SERVICE,
  LIST_SETORES_SERVICE,
  LIST_SETORES_BY_ORGAO_SERVICE,
  ORGAO_REPOSITORY,
  SETOR_REPOSITORY,
  UPDATE_ORGAO_SERVICE,
  UPDATE_SETOR_SERVICE,
} from '@/modules/orgaos/symbols';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Module({
  imports: [CoreModule, AuthModule, TypeOrmModule.forFeature([OrgaoModel, SetorModel])],
  controllers: [OrgaoController],
  providers: [
    {
      provide: ORGAO_REPOSITORY,
      inject: [DataSource, TenantContext],
      useFactory: (
        dataSource: DataSource,
        tenantContext: TenantContext,
      ): IOrgaoRepository => new OrgaoRepository(dataSource, tenantContext),
    },
    {
      provide: SETOR_REPOSITORY,
      inject: [DataSource, TenantContext],
      useFactory: (
        dataSource: DataSource,
        tenantContext: TenantContext,
      ): ISetorRepository => new SetorRepository(dataSource, tenantContext),
    },
    {
      provide: CREATE_ORGAO_SERVICE,
      inject: [ORGAO_REPOSITORY],
      useFactory: (repository: IOrgaoRepository): ICreateOrgaoUseCase =>
        new CreateOrgaoService(repository),
    },
    {
      provide: LIST_ORGAOS_SERVICE,
      inject: [ORGAO_REPOSITORY],
      useFactory: (repository: IOrgaoRepository): IListOrgaosUseCase =>
        new ListOrgaosService(repository),
    },
    {
      provide: LIST_ORGAOS_BY_LOCALIDADE_SERVICE,
      inject: [ORGAO_REPOSITORY],
      useFactory: (
        repository: IOrgaoRepository,
      ): IListOrgaosByLocalidadeUseCase =>
        new ListOrgaosByLocalidadeService(repository),
    },
    {
      provide: UPDATE_ORGAO_SERVICE,
      inject: [ORGAO_REPOSITORY],
      useFactory: (repository: IOrgaoRepository): IUpdateOrgaoUseCase =>
        new UpdateOrgaoService(repository),
    },
    {
      provide: CREATE_SETOR_SERVICE,
      inject: [SETOR_REPOSITORY],
      useFactory: (repository: ISetorRepository): ICreateSetorUseCase =>
        new CreateSetorService(repository),
    },
    {
      provide: LIST_SETORES_SERVICE,
      inject: [SETOR_REPOSITORY],
      useFactory: (repository: ISetorRepository): IListSetoresUseCase =>
        new ListSetoresService(repository),
    },
    {
      provide: LIST_SETORES_BY_ORGAO_SERVICE,
      inject: [SETOR_REPOSITORY],
      useFactory: (
        repository: ISetorRepository,
      ): IListSetoresByOrgaoUseCase =>
        new ListSetoresByOrgaoService(repository),
    },
    {
      provide: UPDATE_SETOR_SERVICE,
      inject: [SETOR_REPOSITORY],
      useFactory: (repository: ISetorRepository): IUpdateSetorUseCase =>
        new UpdateSetorService(repository),
    },
  ],
  exports: [
    ORGAO_REPOSITORY,
    SETOR_REPOSITORY,
    CREATE_ORGAO_SERVICE,
    LIST_ORGAOS_BY_LOCALIDADE_SERVICE,
    LIST_ORGAOS_SERVICE,
    UPDATE_ORGAO_SERVICE,
    CREATE_SETOR_SERVICE,
    LIST_SETORES_SERVICE,
    LIST_SETORES_BY_ORGAO_SERVICE,
    UPDATE_SETOR_SERVICE,
  ],
})
export default class OrgaosModule {}
