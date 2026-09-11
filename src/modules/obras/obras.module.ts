import CoreModule from '@/core/core.module';
import TenantContext from '@/core/multitenancy/tenant_context';
import AuthModule from '@/modules/auth/auth.module';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import IFonteRepository from '@/modules/fontes/adapters/fonte_repository.interface';
import FontesModule from '@/modules/fontes/fontes.module';
import { FONTE_REPOSITORY } from '@/modules/fontes/symbols';
import IObraRepository from '@/modules/obras/adapters/obra_repository.interface';
import IObservacaoRepository from '@/modules/obras/adapters/observacao_repository.interface';
import ITagRepository from '@/modules/obras/adapters/tag_repository.interface';
import CreateObraService from '@/modules/obras/application/create_obra.service';
import GetObraService from '@/modules/obras/application/get_obra.service';
import ListObrasService from '@/modules/obras/application/list_obras.service';
import UpdateObraService from '@/modules/obras/application/update_obra.service';
import EquipeService from '@/modules/obras/application/equipe.service';
import TagsService from '@/modules/obras/application/tags.service';
import ObservacoesService from '@/modules/obras/application/observacoes.service';
import ObservacoesController from '@/modules/obras/controller/observacoes.controller';
import EquipeController from '@/modules/obras/controller/equipe.controller';
import TagsController from '@/modules/obras/controller/tags.controller';
import DuplicateObraService from '@/modules/obras/application/duplicate_obra.service';
import ObraController from '@/modules/obras/controller/obra.controller';
import ICreateObraUseCase from '@/modules/obras/domain/usecase/create_obra.usecase';
import ObraModel from '@/modules/obras/infra/models/obra.model';
import {
  ObraOrcamentoModel,
  ObraResponsavelModel,
  ObraSeguidorModel,
} from '@/modules/obras/infra/models/obra_items.model';
import ObraTagModel from '@/modules/obras/infra/models/obra_tag.model';
import TagModel from '@/modules/obras/infra/models/tag.model';
import ObservacaoModel from '@/modules/obras/infra/models/observacao.model';
import ObraRepository from '@/modules/obras/infra/repositories/obra.repository';
import ObservacaoRepository from '@/modules/obras/infra/repositories/observacao.repository';
import TagRepository from '@/modules/obras/infra/repositories/tag.repository';
import {
  CREATE_OBRA_SERVICE,
  DUPLICATE_OBRA_SERVICE,
  GET_OBRA_SERVICE,
  LIST_OBRAS_SERVICE,
  OBRA_REPOSITORY,
  OBSERVACAO_REPOSITORY,
  TAG_REPOSITORY,
  EQUIPE_SERVICE,
  OBSERVACOES_SERVICE,
  TAGS_SERVICE,
  UPDATE_OBRA_SERVICE,
} from '@/modules/obras/symbols';
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
      TagModel,
      ObraTagModel,
      ObservacaoModel,
    ]),
  ],
  controllers: [ObraController, EquipeController, TagsController, ObservacoesController],
  providers: [
    AccessTokenGuard,
    {
      provide: OBRA_REPOSITORY,
      inject: [DataSource, TenantContext],
      useFactory: (ds: DataSource, tc: TenantContext): IObraRepository =>
        new ObraRepository(ds, tc),
    },
    {
      provide: TAG_REPOSITORY,
      inject: [DataSource, TenantContext],
      useFactory: (ds: DataSource, tc: TenantContext): ITagRepository =>
        new TagRepository(ds, tc),
    },
    {
      provide: OBSERVACAO_REPOSITORY,
      inject: [DataSource, TenantContext],
      useFactory: (ds: DataSource, tc: TenantContext): IObservacaoRepository =>
        new ObservacaoRepository(ds, tc),
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
    {
      provide: LIST_OBRAS_SERVICE,
      inject: [OBRA_REPOSITORY, TenantContext],
      useFactory: (repo: IObraRepository, tc: TenantContext) =>
        new ListObrasService(repo, tc),
    },
    {
      provide: GET_OBRA_SERVICE,
      inject: [OBRA_REPOSITORY, TenantContext],
      useFactory: (repo: IObraRepository, tc: TenantContext) =>
        new GetObraService(repo, tc),
    },
    {
      provide: DUPLICATE_OBRA_SERVICE,
      inject: [OBRA_REPOSITORY, DataSource, TenantContext],
      useFactory: (repo: IObraRepository, ds: DataSource, tc: TenantContext) =>
        new DuplicateObraService(repo, ds, tc),
    },
    {
      provide: EQUIPE_SERVICE,
      inject: [DataSource, TenantContext],
      useFactory: (ds: DataSource, tc: TenantContext) => new EquipeService(ds, tc),
    },
    {
      provide: OBSERVACOES_SERVICE,
      inject: [OBSERVACAO_REPOSITORY, DataSource, TenantContext],
      useFactory: (repo: IObservacaoRepository, ds: DataSource, tc: TenantContext) =>
        new ObservacoesService(repo, ds, tc),
    },
    {
      provide: TAGS_SERVICE,
      inject: [TAG_REPOSITORY, DataSource, TenantContext],
      useFactory: (tagRepo: ITagRepository, ds: DataSource, tc: TenantContext) =>
        new TagsService(tagRepo, ds, tc),
    },
    {
      provide: UPDATE_OBRA_SERVICE,
      inject: [OBRA_REPOSITORY, TenantContext],
      useFactory: (repo: IObraRepository, tc: TenantContext) =>
        new UpdateObraService(repo, tc),
    },
  ],
  exports: [OBRA_REPOSITORY, TAG_REPOSITORY, OBSERVACAO_REPOSITORY, CREATE_OBRA_SERVICE, LIST_OBRAS_SERVICE, GET_OBRA_SERVICE, UPDATE_OBRA_SERVICE, DUPLICATE_OBRA_SERVICE],
})
export default class ObrasModule {}
