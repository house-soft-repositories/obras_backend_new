import CoreModule from '@/core/core.module';
import TenantContext from '@/core/multitenancy/tenant_context';
import AuthModule from '@/modules/auth/auth.module';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import IPessoaRepository from '@/modules/pessoas/adapters/pessoa_repository.interface';
import CreatePessoaService from '@/modules/pessoas/application/create_pessoa.service';
import ListPessoasService from '@/modules/pessoas/application/list_pessoas.service';
import PessoaController from '@/modules/pessoas/controller/pessoa.controller';
import ICreatePessoaUseCase from '@/modules/pessoas/domain/usecase/create_pessoa.usecase';
import IListPessoasUseCase from '@/modules/pessoas/domain/usecase/list_pessoas.usecase';
import PessoaModel from '@/modules/pessoas/infra/models/pessoa.model';
import PessoaRepository from '@/modules/pessoas/infra/repositories/pessoa.repository';
import {
  CREATE_PESSOA_SERVICE,
  LIST_PESSOAS_SERVICE,
  PESSOA_REPOSITORY,
} from '@/modules/pessoas/symbols';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
@Module({
  imports: [CoreModule, AuthModule, TypeOrmModule.forFeature([PessoaModel])],
  controllers: [PessoaController],
  providers: [
    AccessTokenGuard,
    {
      provide: PESSOA_REPOSITORY,
      inject: [DataSource, TenantContext],
      useFactory: (ds: DataSource, tc: TenantContext): IPessoaRepository =>
        new PessoaRepository(ds, tc),
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
  ],
  exports: [PESSOA_REPOSITORY, CREATE_PESSOA_SERVICE, LIST_PESSOAS_SERVICE],
})
export default class PessoasModule {}
