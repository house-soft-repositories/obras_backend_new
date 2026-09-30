import CoreModule from '@/core/core.module';
import TenantContext from '@/core/multitenancy/tenant_context';
import AuthModule from '@/modules/auth/auth.module';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import IPessoaRepository from '@/modules/pessoas/adapters/pessoa_repository.interface';
import IProfissionalTecnicoRepository from '@/modules/pessoas/adapters/profissional_tecnico_repository.interface';
import BuscarProfissionaisTecnicosService from '@/modules/pessoas/application/buscar_profissionais_tecnicos.service';
import BuscarPessoasService from '@/modules/pessoas/application/buscar_pessoas.service';
import CreateProfissionalTecnicoService from '@/modules/pessoas/application/create_profissional_tecnico.service';
import CreatePessoaService from '@/modules/pessoas/application/create_pessoa.service';
import DeletePessoaService from '@/modules/pessoas/application/delete_pessoa.service';
import GetPessoaService from '@/modules/pessoas/application/get_pessoa.service';
import GetProfissionalTecnicoService from '@/modules/pessoas/application/get_profissional_tecnico.service';
import ListProfissionaisTecnicosService from '@/modules/pessoas/application/list_profissionais_tecnicos.service';
import ListPessoasService from '@/modules/pessoas/application/list_pessoas.service';
import UpdateProfissionalTecnicoService from '@/modules/pessoas/application/update_profissional_tecnico.service';
import UpdatePessoaService from '@/modules/pessoas/application/update_pessoa.service';
import PessoaController from '@/modules/pessoas/controller/pessoa.controller';
import ProfissionalTecnicoController from '@/modules/pessoas/controller/profissional_tecnico.controller';
import IBuscarProfissionaisTecnicosUseCase from '@/modules/pessoas/domain/usecase/buscar_profissionais_tecnicos.usecase';
import IBuscarPessoasUseCase from '@/modules/pessoas/domain/usecase/buscar_pessoas.usecase';
import ICreateProfissionalTecnicoUseCase from '@/modules/pessoas/domain/usecase/create_profissional_tecnico.usecase';
import ICreatePessoaUseCase from '@/modules/pessoas/domain/usecase/create_pessoa.usecase';
import IDeletePessoaUseCase from '@/modules/pessoas/domain/usecase/delete_pessoa.usecase';
import IGetPessoaUseCase from '@/modules/pessoas/domain/usecase/get_pessoa.usecase';
import IGetProfissionalTecnicoUseCase from '@/modules/pessoas/domain/usecase/get_profissional_tecnico.usecase';
import IListProfissionaisTecnicosUseCase from '@/modules/pessoas/domain/usecase/list_profissionais_tecnicos.usecase';
import IListPessoasUseCase from '@/modules/pessoas/domain/usecase/list_pessoas.usecase';
import IUpdateProfissionalTecnicoUseCase from '@/modules/pessoas/domain/usecase/update_profissional_tecnico.usecase';
import IUpdatePessoaUseCase from '@/modules/pessoas/domain/usecase/update_pessoa.usecase';
import ProfissionalTecnicoModel from '@/modules/pessoas/infra/models/profissional_tecnico.model';
import PessoaModel from '@/modules/pessoas/infra/models/pessoa.model';
import ProfissionalTecnicoRepository from '@/modules/pessoas/infra/repositories/profissional_tecnico.repository';
import PessoaRepository from '@/modules/pessoas/infra/repositories/pessoa.repository';
import {
  BUSCAR_PROFISSIONAIS_TECNICOS_SERVICE,
  BUSCAR_PESSOAS_SERVICE,
  CREATE_PROFISSIONAL_TECNICO_SERVICE,
  CREATE_PESSOA_SERVICE,
  DELETE_PESSOA_SERVICE,
  GET_PROFISSIONAL_TECNICO_SERVICE,
  GET_PESSOA_SERVICE,
  LIST_PROFISSIONAIS_TECNICOS_SERVICE,
  LIST_PESSOAS_SERVICE,
  PESSOA_REPOSITORY,
  PROFISSIONAL_TECNICO_REPOSITORY,
  UPDATE_PROFISSIONAL_TECNICO_SERVICE,
  UPDATE_PESSOA_SERVICE,
} from '@/modules/pessoas/symbols';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
@Module({
  imports: [
    CoreModule,
    AuthModule,
    TypeOrmModule.forFeature([PessoaModel, ProfissionalTecnicoModel]),
  ],
  controllers: [PessoaController, ProfissionalTecnicoController],
  providers: [
    AccessTokenGuard,
    {
      provide: PESSOA_REPOSITORY,
      inject: [DataSource, TenantContext],
      useFactory: (ds: DataSource, tc: TenantContext): IPessoaRepository =>
        new PessoaRepository(ds, tc),
    },
    {
      provide: PROFISSIONAL_TECNICO_REPOSITORY,
      inject: [DataSource, TenantContext],
      useFactory: (
        ds: DataSource,
        tc: TenantContext,
      ): IProfissionalTecnicoRepository =>
        new ProfissionalTecnicoRepository(ds, tc),
    },
    {
      provide: CREATE_PESSOA_SERVICE,
      inject: [PESSOA_REPOSITORY],
      useFactory: (r: IPessoaRepository): ICreatePessoaUseCase =>
        new CreatePessoaService(r),
    },
    {
      provide: LIST_PESSOAS_SERVICE,
      inject: [PESSOA_REPOSITORY],
      useFactory: (r: IPessoaRepository): IListPessoasUseCase =>
        new ListPessoasService(r),
    },
    {
      provide: GET_PESSOA_SERVICE,
      inject: [PESSOA_REPOSITORY],
      useFactory: (r: IPessoaRepository): IGetPessoaUseCase =>
        new GetPessoaService(r),
    },
    {
      provide: UPDATE_PESSOA_SERVICE,
      inject: [PESSOA_REPOSITORY],
      useFactory: (r: IPessoaRepository): IUpdatePessoaUseCase =>
        new UpdatePessoaService(r),
    },
    {
      provide: DELETE_PESSOA_SERVICE,
      inject: [PESSOA_REPOSITORY],
      useFactory: (r: IPessoaRepository): IDeletePessoaUseCase =>
        new DeletePessoaService(r),
    },
    {
      provide: BUSCAR_PESSOAS_SERVICE,
      inject: [PESSOA_REPOSITORY],
      useFactory: (r: IPessoaRepository): IBuscarPessoasUseCase =>
        new BuscarPessoasService(r),
    },
    {
      provide: CREATE_PROFISSIONAL_TECNICO_SERVICE,
      inject: [PESSOA_REPOSITORY, PROFISSIONAL_TECNICO_REPOSITORY],
      useFactory: (
        pr: IPessoaRepository,
        ptr: IProfissionalTecnicoRepository,
      ): ICreateProfissionalTecnicoUseCase =>
        new CreateProfissionalTecnicoService(pr, ptr),
    },
    {
      provide: LIST_PROFISSIONAIS_TECNICOS_SERVICE,
      inject: [PROFISSIONAL_TECNICO_REPOSITORY],
      useFactory: (
        r: IProfissionalTecnicoRepository,
      ): IListProfissionaisTecnicosUseCase =>
        new ListProfissionaisTecnicosService(r),
    },
    {
      provide: BUSCAR_PROFISSIONAIS_TECNICOS_SERVICE,
      inject: [PROFISSIONAL_TECNICO_REPOSITORY],
      useFactory: (
        r: IProfissionalTecnicoRepository,
      ): IBuscarProfissionaisTecnicosUseCase =>
        new BuscarProfissionaisTecnicosService(r),
    },
    {
      provide: GET_PROFISSIONAL_TECNICO_SERVICE,
      inject: [PROFISSIONAL_TECNICO_REPOSITORY],
      useFactory: (
        r: IProfissionalTecnicoRepository,
      ): IGetProfissionalTecnicoUseCase => new GetProfissionalTecnicoService(r),
    },
    {
      provide: UPDATE_PROFISSIONAL_TECNICO_SERVICE,
      inject: [PROFISSIONAL_TECNICO_REPOSITORY],
      useFactory: (
        r: IProfissionalTecnicoRepository,
      ): IUpdateProfissionalTecnicoUseCase =>
        new UpdateProfissionalTecnicoService(r),
    },
  ],
  exports: [
    PESSOA_REPOSITORY,
    PROFISSIONAL_TECNICO_REPOSITORY,
    CREATE_PESSOA_SERVICE,
    LIST_PESSOAS_SERVICE,
    GET_PESSOA_SERVICE,
    UPDATE_PESSOA_SERVICE,
    DELETE_PESSOA_SERVICE,
    BUSCAR_PESSOAS_SERVICE,
    CREATE_PROFISSIONAL_TECNICO_SERVICE,
    LIST_PROFISSIONAIS_TECNICOS_SERVICE,
    BUSCAR_PROFISSIONAIS_TECNICOS_SERVICE,
    GET_PROFISSIONAL_TECNICO_SERVICE,
    UPDATE_PROFISSIONAL_TECNICO_SERVICE,
  ],
})
export default class PessoasModule {}
