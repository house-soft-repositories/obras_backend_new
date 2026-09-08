import CoreModule from '@/core/core.module';
import TenantContext from '@/core/multitenancy/tenant_context';
import AuthModule from '@/modules/auth/auth.module';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import IObraPrivadaRepository from '@/modules/obras-privadas/adapters/obra_privada_repository.interface';
import CreateObraPrivadaService from '@/modules/obras-privadas/application/create_obra_privada.service';
import ObraPrivadaController from '@/modules/obras-privadas/controller/obra_privada.controller';
import ICreateObraPrivadaUseCase from '@/modules/obras-privadas/domain/usecase/create_obra_privada.usecase';
import ObraPrivadaModel from '@/modules/obras-privadas/infra/models/obra_privada.model';
import ObraPrivadaRepository from '@/modules/obras-privadas/infra/repositories/obra_privada.repository';
import {
  CREATE_OBRA_PRIVADA_SERVICE,
  OBRA_PRIVADA_REPOSITORY,
} from '@/modules/obras-privadas/symbols';
import IPessoaRepository from '@/modules/pessoas/adapters/pessoa_repository.interface';
import PessoasModule from '@/modules/pessoas/pessoas.module';
import { PESSOA_REPOSITORY } from '@/modules/pessoas/symbols';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
@Module({
  imports: [
    CoreModule,
    AuthModule,
    PessoasModule,
    TypeOrmModule.forFeature([ObraPrivadaModel]),
  ],
  controllers: [ObraPrivadaController],
  providers: [
    AccessTokenGuard,
    {
      provide: OBRA_PRIVADA_REPOSITORY,
      inject: [DataSource, TenantContext],
      useFactory: (ds: DataSource, tc: TenantContext): IObraPrivadaRepository =>
        new ObraPrivadaRepository(ds, tc),
    },
    {
      provide: CREATE_OBRA_PRIVADA_SERVICE,
      inject: [OBRA_PRIVADA_REPOSITORY, PESSOA_REPOSITORY, TenantContext],
      useFactory: (
        repo: IObraPrivadaRepository,
        pessoa: IPessoaRepository,
        tc: TenantContext,
      ): ICreateObraPrivadaUseCase =>
        new CreateObraPrivadaService(repo, pessoa, tc),
    },
  ],
  exports: [OBRA_PRIVADA_REPOSITORY, CREATE_OBRA_PRIVADA_SERVICE],
})
export default class ObrasPrivadasModule {}
