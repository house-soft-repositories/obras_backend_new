import CoreModule from '@/core/core.module';
import TenantContext from '@/core/multitenancy/tenant_context';
import AuthModule from '@/modules/auth/auth.module';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import IFonteRepository from '@/modules/fontes/adapters/fonte_repository.interface';
import FontesModule from '@/modules/fontes/fontes.module';
import { ClassificacaoModel, EixoModel, SubclassificacaoModel, SubtipologiaModel, TipologiaModel } from '@/modules/obras/infra/models/cadastro.model';
import { LicencaModel, ObraLocalizacaoModel, ObraOrcamentoPrevistoModel, RecebimentoModel, TitularidadeModel } from '@/modules/obras/infra/models/guias.model';
import { FONTE_REPOSITORY } from '@/modules/fontes/symbols';
import {
  IClassificacaoRepository,
  IEixoRepository,
  ISubclassificacaoRepository,
  ISubtipologiaRepository,
  ITipologiaRepository,
} from '@/modules/obras/adapters/cadastros_repository.interface';
import IGuiasRepository from '@/modules/obras/adapters/guias_repository.interface';
import IObraRepository from '@/modules/obras/adapters/obra_repository.interface';
import IObservacaoRepository from '@/modules/obras/adapters/observacao_repository.interface';
import ITagRepository from '@/modules/obras/adapters/tag_repository.interface';
import CreateObraService from '@/modules/obras/application/create_obra.service';
import GetObraService from '@/modules/obras/application/get_obra.service';
import ListObrasService from '@/modules/obras/application/list_obras.service';
import UpdateObraService from '@/modules/obras/application/update_obra.service';
import EquipeService from '@/modules/obras/application/equipe.service';
import TagsService from '@/modules/obras/application/tags.service';
import CreateClassificacaoService from '@/modules/obras/application/create_classificacao.service';
import CreateEixoService from '@/modules/obras/application/create_eixo.service';
import CreateSubclassificacaoService from '@/modules/obras/application/create_subclassificacao.service';
import CreateSubtipologiaService from '@/modules/obras/application/create_subtipologia.service';
import CreateTipologiaService from '@/modules/obras/application/create_tipologia.service';
import ListClassificacoesService from '@/modules/obras/application/list_classificacao.service';
import ListEixosService from '@/modules/obras/application/list_eixo.service';
import ListSubclassificacoesService from '@/modules/obras/application/list_subclassificacao.service';
import ListSubtipologiasService from '@/modules/obras/application/list_subtipologia.service';
import ListTipologiasService from '@/modules/obras/application/list_tipologia.service';
import UpdateClassificacaoService from '@/modules/obras/application/update_classificacao.service';
import UpdateEixoService from '@/modules/obras/application/update_eixo.service';
import UpdateSubclassificacaoService from '@/modules/obras/application/update_subclassificacao.service';
import UpdateSubtipologiaService from '@/modules/obras/application/update_subtipologia.service';
import UpdateTipologiaService from '@/modules/obras/application/update_tipologia.service';
import GuiasService from '@/modules/obras/application/guias.service';
import ObservacoesService from '@/modules/obras/application/observacoes.service';
import CadastrosController from '@/modules/obras/controller/cadastros.controller';
import GuiasController from '@/modules/obras/controller/guias.controller';
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
import ClassificacaoRepository from '@/modules/obras/infra/repositories/classificacao.repository';
import EixoRepository from '@/modules/obras/infra/repositories/eixo.repository';
import SubclassificacaoRepository from '@/modules/obras/infra/repositories/subclassificacao.repository';
import SubtipologiaRepository from '@/modules/obras/infra/repositories/subtipologia.repository';
import TipologiaRepository from '@/modules/obras/infra/repositories/tipologia.repository';
import GuiasRepository from '@/modules/obras/infra/repositories/guias.repository';
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
  CLASSIFICACAO_REPOSITORY,
  CREATE_CLASSIFICACAO_SERVICE,
  CREATE_EIXO_SERVICE,
  CREATE_SUBCLASSIFICACAO_SERVICE,
  CREATE_SUBTIPOLOGIA_SERVICE,
  CREATE_TIPOLOGIA_SERVICE,
  LIST_CLASSIFICACOES_SERVICE,
  LIST_EIXOS_SERVICE,
  LIST_SUBCLASSIFICACOES_SERVICE,
  LIST_SUBTIPOLOGIAS_SERVICE,
  LIST_TIPOLOGIAS_SERVICE,
  UPDATE_CLASSIFICACAO_SERVICE,
  UPDATE_EIXO_SERVICE,
  UPDATE_SUBCLASSIFICACAO_SERVICE,
  UPDATE_SUBTIPOLOGIA_SERVICE,
  UPDATE_TIPOLOGIA_SERVICE,
  EIXO_REPOSITORY,
  EQUIPE_SERVICE,
  GUIAS_REPOSITORY,
  GUIAS_SERVICE,
  OBSERVACOES_SERVICE,
  TAGS_SERVICE,
  SUBCLASSIFICACAO_REPOSITORY,
  SUBTIPOLOGIA_REPOSITORY,
  TIPOLOGIA_REPOSITORY,
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
      EixoModel,
      ClassificacaoModel,
      SubclassificacaoModel,
      TipologiaModel,
      SubtipologiaModel,
      ObraLocalizacaoModel,
      ObraOrcamentoPrevistoModel,
      TitularidadeModel,
      LicencaModel,
      RecebimentoModel,
      TagModel,
      ObraTagModel,
      ObservacaoModel,
    ]),
  ],
  controllers: [ObraController, CadastrosController, GuiasController, EquipeController, TagsController, ObservacoesController],
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
      provide: EIXO_REPOSITORY,
      inject: [DataSource, TenantContext],
      useFactory: (ds: DataSource, tc: TenantContext): IEixoRepository =>
        new EixoRepository(ds, tc),
    },
    {
      provide: CLASSIFICACAO_REPOSITORY,
      inject: [DataSource, TenantContext],
      useFactory: (
        ds: DataSource,
        tc: TenantContext,
      ): IClassificacaoRepository => new ClassificacaoRepository(ds, tc),
    },
    {
      provide: SUBCLASSIFICACAO_REPOSITORY,
      inject: [DataSource, TenantContext],
      useFactory: (
        ds: DataSource,
        tc: TenantContext,
      ): ISubclassificacaoRepository => new SubclassificacaoRepository(ds, tc),
    },
    {
      provide: TIPOLOGIA_REPOSITORY,
      inject: [DataSource, TenantContext],
      useFactory: (ds: DataSource, tc: TenantContext): ITipologiaRepository =>
        new TipologiaRepository(ds, tc),
    },
    {
      provide: SUBTIPOLOGIA_REPOSITORY,
      inject: [DataSource, TenantContext],
      useFactory: (
        ds: DataSource,
        tc: TenantContext,
      ): ISubtipologiaRepository => new SubtipologiaRepository(ds, tc),
    },
    {
      provide: GUIAS_REPOSITORY,
      inject: [DataSource, TenantContext],
      useFactory: (ds: DataSource, tc: TenantContext): IGuiasRepository => new GuiasRepository(ds, tc),
    },
    {
      provide: LIST_EIXOS_SERVICE,
      inject: [EIXO_REPOSITORY],
      useFactory: (repo: IEixoRepository) => new ListEixosService(repo),
    },
    {
      provide: CREATE_EIXO_SERVICE,
      inject: [EIXO_REPOSITORY, TenantContext],
      useFactory: (repo: IEixoRepository, tc: TenantContext) => new CreateEixoService(repo, tc),
    },
    {
      provide: UPDATE_EIXO_SERVICE,
      inject: [EIXO_REPOSITORY],
      useFactory: (repo: IEixoRepository) => new UpdateEixoService(repo),
    },
    {
      provide: LIST_CLASSIFICACOES_SERVICE,
      inject: [CLASSIFICACAO_REPOSITORY],
      useFactory: (repo: IClassificacaoRepository) => new ListClassificacoesService(repo),
    },
    {
      provide: CREATE_CLASSIFICACAO_SERVICE,
      inject: [CLASSIFICACAO_REPOSITORY, TenantContext],
      useFactory: (repo: IClassificacaoRepository, tc: TenantContext) => new CreateClassificacaoService(repo, tc),
    },
    {
      provide: UPDATE_CLASSIFICACAO_SERVICE,
      inject: [CLASSIFICACAO_REPOSITORY],
      useFactory: (repo: IClassificacaoRepository) => new UpdateClassificacaoService(repo),
    },
    {
      provide: LIST_SUBCLASSIFICACOES_SERVICE,
      inject: [SUBCLASSIFICACAO_REPOSITORY],
      useFactory: (repo: ISubclassificacaoRepository) => new ListSubclassificacoesService(repo),
    },
    {
      provide: CREATE_SUBCLASSIFICACAO_SERVICE,
      inject: [SUBCLASSIFICACAO_REPOSITORY, TenantContext],
      useFactory: (repo: ISubclassificacaoRepository, tc: TenantContext) => new CreateSubclassificacaoService(repo, tc),
    },
    {
      provide: UPDATE_SUBCLASSIFICACAO_SERVICE,
      inject: [SUBCLASSIFICACAO_REPOSITORY],
      useFactory: (repo: ISubclassificacaoRepository) => new UpdateSubclassificacaoService(repo),
    },
    {
      provide: LIST_TIPOLOGIAS_SERVICE,
      inject: [TIPOLOGIA_REPOSITORY],
      useFactory: (repo: ITipologiaRepository) => new ListTipologiasService(repo),
    },
    {
      provide: CREATE_TIPOLOGIA_SERVICE,
      inject: [TIPOLOGIA_REPOSITORY, TenantContext],
      useFactory: (repo: ITipologiaRepository, tc: TenantContext) => new CreateTipologiaService(repo, tc),
    },
    {
      provide: UPDATE_TIPOLOGIA_SERVICE,
      inject: [TIPOLOGIA_REPOSITORY],
      useFactory: (repo: ITipologiaRepository) => new UpdateTipologiaService(repo),
    },
    {
      provide: LIST_SUBTIPOLOGIAS_SERVICE,
      inject: [SUBTIPOLOGIA_REPOSITORY],
      useFactory: (repo: ISubtipologiaRepository) => new ListSubtipologiasService(repo),
    },
    {
      provide: CREATE_SUBTIPOLOGIA_SERVICE,
      inject: [SUBTIPOLOGIA_REPOSITORY, TenantContext],
      useFactory: (repo: ISubtipologiaRepository, tc: TenantContext) => new CreateSubtipologiaService(repo, tc),
    },
    {
      provide: UPDATE_SUBTIPOLOGIA_SERVICE,
      inject: [SUBTIPOLOGIA_REPOSITORY],
      useFactory: (repo: ISubtipologiaRepository) => new UpdateSubtipologiaService(repo),
    },
    {
      provide: GUIAS_SERVICE,
      inject: [GUIAS_REPOSITORY, DataSource, TenantContext],
      useFactory: (repo: IGuiasRepository, ds: DataSource, tc: TenantContext) => new GuiasService(repo, ds, tc),
    },
    {
      provide: UPDATE_OBRA_SERVICE,
      inject: [OBRA_REPOSITORY, TenantContext],
      useFactory: (repo: IObraRepository, tc: TenantContext) =>
        new UpdateObraService(repo, tc),
    },
  ],
  exports: [OBRA_REPOSITORY, TAG_REPOSITORY, OBSERVACAO_REPOSITORY, EIXO_REPOSITORY, CLASSIFICACAO_REPOSITORY, SUBCLASSIFICACAO_REPOSITORY, TIPOLOGIA_REPOSITORY, SUBTIPOLOGIA_REPOSITORY, GUIAS_REPOSITORY, CREATE_OBRA_SERVICE, LIST_OBRAS_SERVICE, GET_OBRA_SERVICE, UPDATE_OBRA_SERVICE, DUPLICATE_OBRA_SERVICE],
})
export default class ObrasModule {}
