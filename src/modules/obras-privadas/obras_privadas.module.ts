import GerarDossieObraPrivadaService from '@/modules/obras-privadas/application/gerar_dossie_obra_privada.service';
import GerarRelatorioFiscalizacaoPrivadaService from '@/modules/obras-privadas/application/gerar_relatorio_fiscalizacao_privada.service';
import GerarRelatorioListaObrasPrivadasService from '@/modules/obras-privadas/application/gerar_relatorio_lista_obras_privadas.service';
import RelatorioPrivadasController from '@/modules/obras-privadas/controller/relatorio_privadas.controller';
import type IGerarDossieObraPrivadaUseCase from '@/modules/obras-privadas/domain/usecase/gerar_dossie_obra_privada.usecase';
import type IGerarRelatorioFiscalizacaoPrivadaUseCase from '@/modules/obras-privadas/domain/usecase/gerar_relatorio_fiscalizacao_privada.usecase';
import type IGerarRelatorioListaObrasPrivadasUseCase from '@/modules/obras-privadas/domain/usecase/gerar_relatorio_lista_obras_privadas.usecase';
import CoreModule from '@/core/core.module';
import TenantContext from '@/core/multitenancy/tenant_context';
import AuthModule from '@/modules/auth/auth.module';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import IObraPrivadaArquivoRepository from '@/modules/obras-privadas/adapters/obra_privada_arquivo_repository.interface';
import IObraPrivadaRepository from '@/modules/obras-privadas/adapters/obra_privada_repository.interface';
import IObraPrivadaResponsavelRepository from '@/modules/obras-privadas/adapters/obra_privada_responsavel_repository.interface';
import IObraPrivadaObservacaoRepository from '@/modules/obras-privadas/adapters/obra_privada_observacao_repository.interface';
import IAlvaraRepository from '@/modules/obras-privadas/adapters/alvara_repository.interface';
import IAutoInfracaoRepository from '@/modules/obras-privadas/adapters/auto_infracao_repository.interface';
import IHabiteSeRepository from '@/modules/obras-privadas/adapters/habite_se_repository.interface';
import IFiscalizacaoRepository from '@/modules/obras-privadas/adapters/fiscalizacao_repository.interface';
import CreateAlvaraService from '@/modules/obras-privadas/application/create_alvara.service';
import CreateAutoInfracaoService from '@/modules/obras-privadas/application/create_auto_infracao.service';
import CreateFiscalizacaoService from '@/modules/obras-privadas/application/create_fiscalizacao.service';
import CreateHabiteSeService from '@/modules/obras-privadas/application/create_habite_se.service';
import CreateObraPrivadaService from '@/modules/obras-privadas/application/create_obra_privada.service';
import AtualizarObraService from '@/modules/obras-privadas/application/atualizar_obra.service';
import DetalharFiscalizacaoService from '@/modules/obras-privadas/application/detalhar_fiscalizacao.service';
import DetalharObraService from '@/modules/obras-privadas/application/detalhar_obra.service';
import ExcluirObraService from '@/modules/obras-privadas/application/excluir_obra.service';
import ListarAutosGlobalService from '@/modules/obras-privadas/application/listar_autos_global.service';
import ListarFiscalizacoesGlobalService from '@/modules/obras-privadas/application/listar_fiscalizacoes_global.service';
import ListarLicenciamentoService from '@/modules/obras-privadas/application/listar_licenciamento.service';
import ListarObrasService from '@/modules/obras-privadas/application/listar_obras.service';
import ResumirAutosService from '@/modules/obras-privadas/application/resumir_autos.service';
import CreateObraPrivadaResponsavelService from '@/modules/obras-privadas/application/create_obra_privada_responsavel.service';
import CreateObraPrivadaObservacaoService from '@/modules/obras-privadas/application/create_obra_privada_observacao.service';
import ConfirmarUploadArquivoService from '@/modules/obras-privadas/application/confirmar_upload_arquivo.service';
import EditarArquivoService from '@/modules/obras-privadas/application/editar_arquivo.service';
import ExcluirArquivoService from '@/modules/obras-privadas/application/excluir_arquivo.service';
import IniciarUploadArquivoService from '@/modules/obras-privadas/application/iniciar_upload_arquivo.service';
import ListarArquivosService from '@/modules/obras-privadas/application/listar_arquivos.service';
import ObterArquivoDownloadUrlService from '@/modules/obras-privadas/application/obter_arquivo_download_url.service';
import DeleteAlvaraService from '@/modules/obras-privadas/application/delete_alvara.service';
import DeleteFiscalizacaoService from '@/modules/obras-privadas/application/delete_fiscalizacao.service';
import DeleteHabiteSeService from '@/modules/obras-privadas/application/delete_habite_se.service';
import DeleteObraPrivadaObservacaoService from '@/modules/obras-privadas/application/delete_obra_privada_observacao.service';
import DeleteObraPrivadaResponsavelService from '@/modules/obras-privadas/application/delete_obra_privada_responsavel.service';
import ListAlvarasService from '@/modules/obras-privadas/application/list_alvaras.service';
import ListAutosInfracaoService from '@/modules/obras-privadas/application/list_autos_infracao.service';
import ListFiscalizacoesService from '@/modules/obras-privadas/application/list_fiscalizacoes.service';
import ListHabiteSeService from '@/modules/obras-privadas/application/list_habite_se.service';
import ListObraPrivadaEtapasService from '@/modules/obras-privadas/application/list_obra_privada_etapas.service';
import ListObraPrivadaTimelineService from '@/modules/obras-privadas/application/list_obra_privada_timeline.service';
import ListObrasNoMesmoImovelService from '@/modules/obras-privadas/application/list_obras_no_mesmo_imovel.service';
import ListObraPrivadaObservacoesService from '@/modules/obras-privadas/application/list_obra_privada_observacoes.service';
import ListObraPrivadaResponsaveisService from '@/modules/obras-privadas/application/list_obra_privada_responsaveis.service';
import UpdateAlvaraService from '@/modules/obras-privadas/application/update_alvara.service';
import UpdateAutoInfracaoService from '@/modules/obras-privadas/application/update_auto_infracao.service';
import UpdateFiscalizacaoService from '@/modules/obras-privadas/application/update_fiscalizacao.service';
import UpdateHabiteSeService from '@/modules/obras-privadas/application/update_habite_se.service';
import UpdateObraPrivadaResponsavelService from '@/modules/obras-privadas/application/update_obra_privada_responsavel.service';
import AlvaraController from '@/modules/obras-privadas/controller/alvara.controller';
import AutoInfracaoController from '@/modules/obras-privadas/controller/auto_infracao.controller';
import FiscalizacaoController from '@/modules/obras-privadas/controller/fiscalizacao.controller';
import HabiteSeController from '@/modules/obras-privadas/controller/habite_se.controller';
import ObraPrivadaController from '@/modules/obras-privadas/controller/obra_privada.controller';
import ObraPrivadaObservacaoController from '@/modules/obras-privadas/controller/obra_privada_observacao.controller';
import ObraPrivadaResponsavelController from '@/modules/obras-privadas/controller/obra_privada_responsavel.controller';
import ArquivoPrivadoController from '@/modules/obras-privadas/controller/arquivo_privado.controller';
import ObraPrivadaArquivoController from '@/modules/obras-privadas/controller/obra_privada_arquivo.controller';
import IConfirmarUploadArquivoUseCase from '@/modules/obras-privadas/domain/usecase/confirmar_upload_arquivo.usecase';
import IEditarArquivoUseCase from '@/modules/obras-privadas/domain/usecase/editar_arquivo.usecase';
import IExcluirArquivoUseCase from '@/modules/obras-privadas/domain/usecase/excluir_arquivo.usecase';
import IIniciarUploadArquivoUseCase from '@/modules/obras-privadas/domain/usecase/iniciar_upload_arquivo.usecase';
import IListarArquivosUseCase from '@/modules/obras-privadas/domain/usecase/listar_arquivos.usecase';
import IObterArquivoDownloadUrlUseCase from '@/modules/obras-privadas/domain/usecase/obter_arquivo_download_url.usecase';
import ICreateAlvaraUseCase from '@/modules/obras-privadas/domain/usecase/create_alvara.usecase';
import ICreateAutoInfracaoUseCase from '@/modules/obras-privadas/domain/usecase/create_auto_infracao.usecase';
import ICreateFiscalizacaoUseCase from '@/modules/obras-privadas/domain/usecase/create_fiscalizacao.usecase';
import ICreateHabiteSeUseCase from '@/modules/obras-privadas/domain/usecase/create_habite_se.usecase';
import ICreateObraPrivadaUseCase from '@/modules/obras-privadas/domain/usecase/create_obra_privada.usecase';
import IAtualizarObraUseCase from '@/modules/obras-privadas/domain/usecase/atualizar_obra.usecase';
import IDetalharFiscalizacaoUseCase from '@/modules/obras-privadas/domain/usecase/detalhar_fiscalizacao.usecase';
import IDetalharObraUseCase from '@/modules/obras-privadas/domain/usecase/detalhar_obra.usecase';
import IExcluirObraUseCase from '@/modules/obras-privadas/domain/usecase/excluir_obra.usecase';
import IListarAutosGlobalUseCase from '@/modules/obras-privadas/domain/usecase/listar_autos_global.usecase';
import IListarFiscalizacoesGlobalUseCase from '@/modules/obras-privadas/domain/usecase/listar_fiscalizacoes_global.usecase';
import IListarLicenciamentoUseCase from '@/modules/obras-privadas/domain/usecase/listar_licenciamento.usecase';
import IListarObrasUseCase from '@/modules/obras-privadas/domain/usecase/listar_obras.usecase';
import IResumirAutosUseCase from '@/modules/obras-privadas/domain/usecase/resumir_autos.usecase';
import ICreateObraPrivadaObservacaoUseCase from '@/modules/obras-privadas/domain/usecase/create_obra_privada_observacao.usecase';
import ICreateObraPrivadaResponsavelUseCase from '@/modules/obras-privadas/domain/usecase/create_obra_privada_responsavel.usecase';
import IDeleteAlvaraUseCase from '@/modules/obras-privadas/domain/usecase/delete_alvara.usecase';
import IDeleteFiscalizacaoUseCase from '@/modules/obras-privadas/domain/usecase/delete_fiscalizacao.usecase';
import IDeleteHabiteSeUseCase from '@/modules/obras-privadas/domain/usecase/delete_habite_se.usecase';
import IDeleteObraPrivadaObservacaoUseCase from '@/modules/obras-privadas/domain/usecase/delete_obra_privada_observacao.usecase';
import IDeleteObraPrivadaResponsavelUseCase from '@/modules/obras-privadas/domain/usecase/delete_obra_privada_responsavel.usecase';
import IListAlvarasUseCase from '@/modules/obras-privadas/domain/usecase/list_alvaras.usecase';
import IListAutosInfracaoUseCase from '@/modules/obras-privadas/domain/usecase/list_autos_infracao.usecase';
import IListFiscalizacoesUseCase from '@/modules/obras-privadas/domain/usecase/list_fiscalizacoes.usecase';
import IListHabiteSeUseCase from '@/modules/obras-privadas/domain/usecase/list_habite_se.usecase';
import IListObraPrivadaEtapasUseCase from '@/modules/obras-privadas/domain/usecase/list_obra_privada_etapas.usecase';
import IListObraPrivadaTimelineUseCase from '@/modules/obras-privadas/domain/usecase/list_obra_privada_timeline.usecase';
import IListObrasNoMesmoImovelUseCase from '@/modules/obras-privadas/domain/usecase/list_obras_no_mesmo_imovel.usecase';
import IListObraPrivadaObservacoesUseCase from '@/modules/obras-privadas/domain/usecase/list_obra_privada_observacoes.usecase';
import IListObraPrivadaResponsaveisUseCase from '@/modules/obras-privadas/domain/usecase/list_obra_privada_responsaveis.usecase';
import IUpdateAlvaraUseCase from '@/modules/obras-privadas/domain/usecase/update_alvara.usecase';
import IUpdateAutoInfracaoUseCase from '@/modules/obras-privadas/domain/usecase/update_auto_infracao.usecase';
import IUpdateFiscalizacaoUseCase from '@/modules/obras-privadas/domain/usecase/update_fiscalizacao.usecase';
import IUpdateHabiteSeUseCase from '@/modules/obras-privadas/domain/usecase/update_habite_se.usecase';
import IUpdateObraPrivadaResponsavelUseCase from '@/modules/obras-privadas/domain/usecase/update_obra_privada_responsavel.usecase';
import IProfissionalTecnicoRepository from '@/modules/pessoas/adapters/profissional_tecnico_repository.interface';
import AlvaraModel from '@/modules/obras-privadas/infra/models/alvara.model';
import AutoInfracaoModel from '@/modules/obras-privadas/infra/models/auto_infracao.model';
import FiscalizacaoModel from '@/modules/obras-privadas/infra/models/fiscalizacao.model';
import HabiteSeModel from '@/modules/obras-privadas/infra/models/habite_se.model';
import ObraPrivadaModel from '@/modules/obras-privadas/infra/models/obra_privada.model';
import ObraPrivadaObservacaoModel from '@/modules/obras-privadas/infra/models/obra_privada_observacao.model';
import ObraPrivadaResponsavelModel from '@/modules/obras-privadas/infra/models/obra_privada_responsavel.model';
import ObraPrivadaArquivoModel from '@/modules/obras-privadas/infra/models/obra_privada_arquivo.model';
import AlvaraRepository from '@/modules/obras-privadas/infra/repositories/alvara.repository';
import AutoInfracaoRepository from '@/modules/obras-privadas/infra/repositories/auto_infracao.repository';
import FiscalizacaoRepository from '@/modules/obras-privadas/infra/repositories/fiscalizacao.repository';
import HabiteSeRepository from '@/modules/obras-privadas/infra/repositories/habite_se.repository';
import ObraPrivadaRepository from '@/modules/obras-privadas/infra/repositories/obra_privada.repository';
import ObraPrivadaObservacaoRepository from '@/modules/obras-privadas/infra/repositories/obra_privada_observacao.repository';
import ObraPrivadaResponsavelRepository from '@/modules/obras-privadas/infra/repositories/obra_privada_responsavel.repository';
import ObraPrivadaArquivoRepository from '@/modules/obras-privadas/infra/repositories/obra_privada_arquivo.repository';
import {
  ALVARA_REPOSITORY,
  AUTO_INFRACAO_REPOSITORY,
  CREATE_ALVARA_SERVICE,
  CREATE_AUTO_INFRACAO_SERVICE,
  CREATE_FISCALIZACAO_SERVICE,
  CREATE_HABITE_SE_SERVICE,
  CREATE_OBRA_PRIVADA_SERVICE,
  CREATE_OBRA_PRIVADA_OBSERVACAO_SERVICE,
  CREATE_OBRA_PRIVADA_RESPONSAVEL_SERVICE,
  CONFIRMAR_UPLOAD_ARQUIVO_SERVICE,
  ATUALIZAR_OBRA_SERVICE,
  DETALHAR_FISCALIZACAO_SERVICE,
  DETALHAR_OBRA_SERVICE,
  EXCLUIR_OBRA_SERVICE,
  LISTAR_AUTOS_GLOBAL_SERVICE,
  LISTAR_FISCALIZACOES_GLOBAL_SERVICE,
  LISTAR_LICENCIAMENTO_SERVICE,
  LISTAR_OBRAS_SERVICE,
  DELETE_ALVARA_SERVICE,
  DELETE_FISCALIZACAO_SERVICE,
  DELETE_HABITE_SE_SERVICE,
  DELETE_OBRA_PRIVADA_OBSERVACAO_SERVICE,
  DELETE_OBRA_PRIVADA_RESPONSAVEL_SERVICE,
  EDITAR_ARQUIVO_SERVICE,
  EXCLUIR_ARQUIVO_SERVICE,
  FISCALIZACAO_REPOSITORY,
  GERAR_DOSSIE_OBRA_PRIVADA_SERVICE,
  GERAR_RELATORIO_FISCALIZACAO_PRIVADA_SERVICE,
  GERAR_RELATORIO_LISTA_OBRAS_PRIVADAS_SERVICE,
  HABITE_SE_REPOSITORY,
  INICIAR_UPLOAD_ARQUIVO_SERVICE,
  LIST_ALVARAS_SERVICE,
  LIST_AUTOS_INFRACAO_SERVICE,
  LIST_FISCALIZACOES_SERVICE,
  LIST_HABITE_SE_SERVICE,
  LISTAR_ARQUIVOS_SERVICE,
  LIST_OBRA_PRIVADA_ETAPAS_SERVICE,
  LIST_OBRA_PRIVADA_TIMELINE_SERVICE,
  LIST_OBRAS_NO_MESMO_IMOVEL_SERVICE,
  LIST_OBRA_PRIVADA_OBSERVACOES_SERVICE,
  LIST_OBRA_PRIVADA_RESPONSAVEIS_SERVICE,
  OBRA_PRIVADA_ARQUIVO_REPOSITORY,
  OBRA_PRIVADA_OBSERVACAO_REPOSITORY,
  OBRA_PRIVADA_RESPONSAVEL_REPOSITORY,
  OBRA_PRIVADA_REPOSITORY,
  OBTER_ARQUIVO_DOWNLOAD_URL_SERVICE,
  RESUMIR_AUTOS_SERVICE,
  UPDATE_ALVARA_SERVICE,
  UPDATE_AUTO_INFRACAO_SERVICE,
  UPDATE_FISCALIZACAO_SERVICE,
  UPDATE_HABITE_SE_SERVICE,
  UPDATE_OBRA_PRIVADA_RESPONSAVEL_SERVICE,
} from '@/modules/obras-privadas/symbols';
import IPessoaRepository from '@/modules/pessoas/adapters/pessoa_repository.interface';
import PessoasModule from '@/modules/pessoas/pessoas.module';
import {
  PESSOA_REPOSITORY,
  PROFISSIONAL_TECNICO_REPOSITORY,
} from '@/modules/pessoas/symbols';
import type IStorageService from '@/modules/storage/adapters/storage_service.interface';
import StorageModule from '@/modules/storage/storage.module';
import { STORAGE_SERVICE } from '@/modules/storage/symbols';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
@Module({
  imports: [
    CoreModule,
    AuthModule,
    PessoasModule,
    StorageModule,
    TypeOrmModule.forFeature([
      ObraPrivadaModel,
      AlvaraModel,
      AutoInfracaoModel,
      FiscalizacaoModel,
      HabiteSeModel,
      ObraPrivadaObservacaoModel,
      ObraPrivadaResponsavelModel,
      ObraPrivadaArquivoModel,
    ]),
  ],
  controllers: [
    ObraPrivadaController,
    AlvaraController,
    AutoInfracaoController,
    FiscalizacaoController,
    HabiteSeController,
    ObraPrivadaObservacaoController,
    ObraPrivadaResponsavelController,
    ObraPrivadaArquivoController,
    ArquivoPrivadoController,
    RelatorioPrivadasController,
  ],
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
    {
      provide: LISTAR_OBRAS_SERVICE,
      inject: [OBRA_PRIVADA_REPOSITORY],
      useFactory: (repo: IObraPrivadaRepository): IListarObrasUseCase =>
        new ListarObrasService(repo),
    },
    {
      provide: DETALHAR_OBRA_SERVICE,
      inject: [
        OBRA_PRIVADA_REPOSITORY,
        PESSOA_REPOSITORY,
        PROFISSIONAL_TECNICO_REPOSITORY,
        OBRA_PRIVADA_RESPONSAVEL_REPOSITORY,
        FISCALIZACAO_REPOSITORY,
        AUTO_INFRACAO_REPOSITORY,
        ALVARA_REPOSITORY,
      ],
      useFactory: (
        obras: IObraPrivadaRepository,
        pessoas: IPessoaRepository,
        profissionais: IProfissionalTecnicoRepository,
        responsaveis: IObraPrivadaResponsavelRepository,
        fiscalizacoes: IFiscalizacaoRepository,
        autos: IAutoInfracaoRepository,
        alvaras: IAlvaraRepository,
      ): IDetalharObraUseCase =>
        new DetalharObraService(
          obras,
          pessoas,
          profissionais,
          responsaveis,
          fiscalizacoes,
          autos,
          alvaras,
        ),
    },
    {
      provide: ATUALIZAR_OBRA_SERVICE,
      inject: [OBRA_PRIVADA_REPOSITORY, PESSOA_REPOSITORY],
      useFactory: (
        repo: IObraPrivadaRepository,
        pessoa: IPessoaRepository,
      ): IAtualizarObraUseCase => new AtualizarObraService(repo, pessoa),
    },
    {
      provide: EXCLUIR_OBRA_SERVICE,
      inject: [OBRA_PRIVADA_REPOSITORY],
      useFactory: (repo: IObraPrivadaRepository): IExcluirObraUseCase =>
        new ExcluirObraService(repo),
    },
    {
      provide: LISTAR_FISCALIZACOES_GLOBAL_SERVICE,
      inject: [FISCALIZACAO_REPOSITORY],
      useFactory: (
        repo: IFiscalizacaoRepository,
      ): IListarFiscalizacoesGlobalUseCase =>
        new ListarFiscalizacoesGlobalService(repo),
    },
    {
      provide: LISTAR_AUTOS_GLOBAL_SERVICE,
      inject: [AUTO_INFRACAO_REPOSITORY],
      useFactory: (repo: IAutoInfracaoRepository): IListarAutosGlobalUseCase =>
        new ListarAutosGlobalService(repo),
    },
    {
      provide: RESUMIR_AUTOS_SERVICE,
      inject: [AUTO_INFRACAO_REPOSITORY],
      useFactory: (repo: IAutoInfracaoRepository): IResumirAutosUseCase =>
        new ResumirAutosService(repo),
    },
    {
      provide: LISTAR_LICENCIAMENTO_SERVICE,
      inject: [OBRA_PRIVADA_REPOSITORY],
      useFactory: (repo: IObraPrivadaRepository): IListarLicenciamentoUseCase =>
        new ListarLicenciamentoService(repo),
    },
    {
      provide: ALVARA_REPOSITORY,
      inject: [DataSource, TenantContext],
      useFactory: (ds: DataSource, tc: TenantContext): IAlvaraRepository =>
        new AlvaraRepository(ds, tc),
    },
    {
      provide: CREATE_ALVARA_SERVICE,
      inject: [ALVARA_REPOSITORY, OBRA_PRIVADA_REPOSITORY],
      useFactory: (
        alvaraRepository: IAlvaraRepository,
        obraPrivadaRepository: IObraPrivadaRepository,
      ): ICreateAlvaraUseCase =>
        new CreateAlvaraService(alvaraRepository, obraPrivadaRepository),
    },
    {
      provide: LIST_ALVARAS_SERVICE,
      inject: [ALVARA_REPOSITORY],
      useFactory: (repo: IAlvaraRepository): IListAlvarasUseCase =>
        new ListAlvarasService(repo),
    },
    {
      provide: UPDATE_ALVARA_SERVICE,
      inject: [ALVARA_REPOSITORY],
      useFactory: (repo: IAlvaraRepository): IUpdateAlvaraUseCase =>
        new UpdateAlvaraService(repo),
    },
    {
      provide: DELETE_ALVARA_SERVICE,
      inject: [ALVARA_REPOSITORY],
      useFactory: (repo: IAlvaraRepository): IDeleteAlvaraUseCase =>
        new DeleteAlvaraService(repo),
    },
    {
      provide: FISCALIZACAO_REPOSITORY,
      inject: [DataSource, TenantContext],
      useFactory: (
        ds: DataSource,
        tc: TenantContext,
      ): IFiscalizacaoRepository => new FiscalizacaoRepository(ds, tc),
    },
    {
      provide: CREATE_FISCALIZACAO_SERVICE,
      inject: [FISCALIZACAO_REPOSITORY, OBRA_PRIVADA_REPOSITORY],
      useFactory: (
        fiscalizacaoRepository: IFiscalizacaoRepository,
        obraPrivadaRepository: IObraPrivadaRepository,
      ): ICreateFiscalizacaoUseCase =>
        new CreateFiscalizacaoService(
          fiscalizacaoRepository,
          obraPrivadaRepository,
        ),
    },
    {
      provide: LIST_FISCALIZACOES_SERVICE,
      inject: [FISCALIZACAO_REPOSITORY],
      useFactory: (repo: IFiscalizacaoRepository): IListFiscalizacoesUseCase =>
        new ListFiscalizacoesService(repo),
    },
    {
      provide: UPDATE_FISCALIZACAO_SERVICE,
      inject: [FISCALIZACAO_REPOSITORY],
      useFactory: (repo: IFiscalizacaoRepository): IUpdateFiscalizacaoUseCase =>
        new UpdateFiscalizacaoService(repo),
    },
    {
      provide: DELETE_FISCALIZACAO_SERVICE,
      inject: [FISCALIZACAO_REPOSITORY],
      useFactory: (repo: IFiscalizacaoRepository): IDeleteFiscalizacaoUseCase =>
        new DeleteFiscalizacaoService(repo),
    },
    {
      provide: DETALHAR_FISCALIZACAO_SERVICE,
      inject: [FISCALIZACAO_REPOSITORY],
      useFactory: (
        repo: IFiscalizacaoRepository,
      ): IDetalharFiscalizacaoUseCase => new DetalharFiscalizacaoService(repo),
    },

    {
      provide: AUTO_INFRACAO_REPOSITORY,
      inject: [DataSource, TenantContext],
      useFactory: (
        ds: DataSource,
        tc: TenantContext,
      ): IAutoInfracaoRepository => new AutoInfracaoRepository(ds, tc),
    },
    {
      provide: CREATE_AUTO_INFRACAO_SERVICE,
      inject: [AUTO_INFRACAO_REPOSITORY, OBRA_PRIVADA_REPOSITORY],
      useFactory: (
        autoRepository: IAutoInfracaoRepository,
        obraPrivadaRepository: IObraPrivadaRepository,
      ): ICreateAutoInfracaoUseCase =>
        new CreateAutoInfracaoService(autoRepository, obraPrivadaRepository),
    },
    {
      provide: LIST_AUTOS_INFRACAO_SERVICE,
      inject: [AUTO_INFRACAO_REPOSITORY],
      useFactory: (repo: IAutoInfracaoRepository): IListAutosInfracaoUseCase =>
        new ListAutosInfracaoService(repo),
    },
    {
      provide: UPDATE_AUTO_INFRACAO_SERVICE,
      inject: [AUTO_INFRACAO_REPOSITORY],
      useFactory: (repo: IAutoInfracaoRepository): IUpdateAutoInfracaoUseCase =>
        new UpdateAutoInfracaoService(repo),
    },

    {
      provide: HABITE_SE_REPOSITORY,
      inject: [DataSource, TenantContext],
      useFactory: (ds: DataSource, tc: TenantContext): IHabiteSeRepository =>
        new HabiteSeRepository(ds, tc),
    },
    {
      provide: CREATE_HABITE_SE_SERVICE,
      inject: [HABITE_SE_REPOSITORY, OBRA_PRIVADA_REPOSITORY],
      useFactory: (
        habiteSeRepository: IHabiteSeRepository,
        obraPrivadaRepository: IObraPrivadaRepository,
      ): ICreateHabiteSeUseCase =>
        new CreateHabiteSeService(habiteSeRepository, obraPrivadaRepository),
    },
    {
      provide: LIST_HABITE_SE_SERVICE,
      inject: [HABITE_SE_REPOSITORY],
      useFactory: (repo: IHabiteSeRepository): IListHabiteSeUseCase =>
        new ListHabiteSeService(repo),
    },
    {
      provide: UPDATE_HABITE_SE_SERVICE,
      inject: [HABITE_SE_REPOSITORY],
      useFactory: (repo: IHabiteSeRepository): IUpdateHabiteSeUseCase =>
        new UpdateHabiteSeService(repo),
    },
    {
      provide: DELETE_HABITE_SE_SERVICE,
      inject: [HABITE_SE_REPOSITORY],
      useFactory: (repo: IHabiteSeRepository): IDeleteHabiteSeUseCase =>
        new DeleteHabiteSeService(repo),
    },

    {
      provide: OBRA_PRIVADA_RESPONSAVEL_REPOSITORY,
      inject: [DataSource, TenantContext],
      useFactory: (
        ds: DataSource,
        tc: TenantContext,
      ): IObraPrivadaResponsavelRepository =>
        new ObraPrivadaResponsavelRepository(ds, tc),
    },
    {
      provide: CREATE_OBRA_PRIVADA_RESPONSAVEL_SERVICE,
      inject: [
        OBRA_PRIVADA_RESPONSAVEL_REPOSITORY,
        PROFISSIONAL_TECNICO_REPOSITORY,
      ],
      useFactory: (
        responsavelRepository: IObraPrivadaResponsavelRepository,
        obraPrivadaRepository: IObraPrivadaRepository,
        profissionalTecnicoRepository: IProfissionalTecnicoRepository,
      ): ICreateObraPrivadaResponsavelUseCase =>
        new CreateObraPrivadaResponsavelService(
          responsavelRepository,
          obraPrivadaRepository,
          profissionalTecnicoRepository,
        ),
    },
    {
      provide: LIST_OBRA_PRIVADA_RESPONSAVEIS_SERVICE,
      inject: [OBRA_PRIVADA_RESPONSAVEL_REPOSITORY],
      useFactory: (
        repo: IObraPrivadaResponsavelRepository,
      ): IListObraPrivadaResponsaveisUseCase =>
        new ListObraPrivadaResponsaveisService(repo),
    },
    {
      provide: UPDATE_OBRA_PRIVADA_RESPONSAVEL_SERVICE,
      inject: [OBRA_PRIVADA_RESPONSAVEL_REPOSITORY],
      useFactory: (
        repo: IObraPrivadaResponsavelRepository,
      ): IUpdateObraPrivadaResponsavelUseCase =>
        new UpdateObraPrivadaResponsavelService(repo),
    },
    {
      provide: DELETE_OBRA_PRIVADA_RESPONSAVEL_SERVICE,
      inject: [OBRA_PRIVADA_RESPONSAVEL_REPOSITORY],
      useFactory: (
        repo: IObraPrivadaResponsavelRepository,
      ): IDeleteObraPrivadaResponsavelUseCase =>
        new DeleteObraPrivadaResponsavelService(repo),
    },
    {
      provide: LIST_OBRAS_NO_MESMO_IMOVEL_SERVICE,
      inject: [OBRA_PRIVADA_REPOSITORY],
      useFactory: (
        repo: IObraPrivadaRepository,
      ): IListObrasNoMesmoImovelUseCase =>
        new ListObrasNoMesmoImovelService(repo),
    },
    {
      provide: LIST_OBRA_PRIVADA_ETAPAS_SERVICE,
      inject: [FISCALIZACAO_REPOSITORY],
      useFactory: (
        repo: IFiscalizacaoRepository,
      ): IListObraPrivadaEtapasUseCase =>
        new ListObraPrivadaEtapasService(repo),
    },
    {
      provide: LIST_OBRA_PRIVADA_TIMELINE_SERVICE,
      inject: [
        ALVARA_REPOSITORY,
        FISCALIZACAO_REPOSITORY,
        AUTO_INFRACAO_REPOSITORY,
        HABITE_SE_REPOSITORY,
        OBRA_PRIVADA_OBSERVACAO_REPOSITORY,
      ],
      useFactory: (
        alvaraRepository: IAlvaraRepository,
        fiscalizacaoRepository: IFiscalizacaoRepository,
        autoInfracaoRepository: IAutoInfracaoRepository,
        habiteSeRepository: IHabiteSeRepository,
        observacaoRepository: IObraPrivadaObservacaoRepository,
      ): IListObraPrivadaTimelineUseCase =>
        new ListObraPrivadaTimelineService(
          alvaraRepository,
          fiscalizacaoRepository,
          autoInfracaoRepository,
          habiteSeRepository,
          observacaoRepository,
        ),
    },
    {
      provide: OBRA_PRIVADA_OBSERVACAO_REPOSITORY,
      inject: [DataSource, TenantContext],
      useFactory: (
        ds: DataSource,
        tc: TenantContext,
      ): IObraPrivadaObservacaoRepository =>
        new ObraPrivadaObservacaoRepository(ds, tc),
    },
    {
      provide: CREATE_OBRA_PRIVADA_OBSERVACAO_SERVICE,
      inject: [OBRA_PRIVADA_OBSERVACAO_REPOSITORY, OBRA_PRIVADA_REPOSITORY],
      useFactory: (
        observacaoRepository: IObraPrivadaObservacaoRepository,
        obraPrivadaRepository: IObraPrivadaRepository,
      ): ICreateObraPrivadaObservacaoUseCase =>
        new CreateObraPrivadaObservacaoService(
          observacaoRepository,
          obraPrivadaRepository,
        ),
    },
    {
      provide: LIST_OBRA_PRIVADA_OBSERVACOES_SERVICE,
      inject: [OBRA_PRIVADA_OBSERVACAO_REPOSITORY],
      useFactory: (
        repo: IObraPrivadaObservacaoRepository,
      ): IListObraPrivadaObservacoesUseCase =>
        new ListObraPrivadaObservacoesService(repo),
    },
    {
      provide: DELETE_OBRA_PRIVADA_OBSERVACAO_SERVICE,
      inject: [OBRA_PRIVADA_OBSERVACAO_REPOSITORY],
      useFactory: (
        repo: IObraPrivadaObservacaoRepository,
      ): IDeleteObraPrivadaObservacaoUseCase =>
        new DeleteObraPrivadaObservacaoService(repo),
    },
    {
      provide: OBRA_PRIVADA_ARQUIVO_REPOSITORY,
      inject: [DataSource, TenantContext],
      useFactory: (
        ds: DataSource,
        tc: TenantContext,
      ): IObraPrivadaArquivoRepository =>
        new ObraPrivadaArquivoRepository(ds, tc),
    },
    {
      provide: INICIAR_UPLOAD_ARQUIVO_SERVICE,
      inject: [
        OBRA_PRIVADA_ARQUIVO_REPOSITORY,
        OBRA_PRIVADA_REPOSITORY,
        STORAGE_SERVICE,
        TenantContext,
      ],
      useFactory: (
        arquivos: IObraPrivadaArquivoRepository,
        obras: IObraPrivadaRepository,
        storage: IStorageService,
        tc: TenantContext,
      ): IIniciarUploadArquivoUseCase =>
        new IniciarUploadArquivoService(arquivos, obras, storage, tc),
    },
    {
      provide: CONFIRMAR_UPLOAD_ARQUIVO_SERVICE,
      inject: [OBRA_PRIVADA_ARQUIVO_REPOSITORY],
      useFactory: (
        repo: IObraPrivadaArquivoRepository,
      ): IConfirmarUploadArquivoUseCase =>
        new ConfirmarUploadArquivoService(repo),
    },
    {
      provide: LISTAR_ARQUIVOS_SERVICE,
      inject: [OBRA_PRIVADA_ARQUIVO_REPOSITORY],
      useFactory: (
        repo: IObraPrivadaArquivoRepository,
      ): IListarArquivosUseCase => new ListarArquivosService(repo),
    },
    {
      provide: OBTER_ARQUIVO_DOWNLOAD_URL_SERVICE,
      inject: [OBRA_PRIVADA_ARQUIVO_REPOSITORY, STORAGE_SERVICE],
      useFactory: (
        arquivos: IObraPrivadaArquivoRepository,
        storage: IStorageService,
      ): IObterArquivoDownloadUrlUseCase =>
        new ObterArquivoDownloadUrlService(arquivos, storage),
    },
    {
      provide: EDITAR_ARQUIVO_SERVICE,
      inject: [OBRA_PRIVADA_ARQUIVO_REPOSITORY],
      useFactory: (
        repo: IObraPrivadaArquivoRepository,
      ): IEditarArquivoUseCase => new EditarArquivoService(repo),
    },
    {
      provide: EXCLUIR_ARQUIVO_SERVICE,
      inject: [OBRA_PRIVADA_ARQUIVO_REPOSITORY, STORAGE_SERVICE],
      useFactory: (
        arquivos: IObraPrivadaArquivoRepository,
        storage: IStorageService,
      ): IExcluirArquivoUseCase => new ExcluirArquivoService(arquivos, storage),
    },
    {
      provide: GERAR_RELATORIO_LISTA_OBRAS_PRIVADAS_SERVICE,
      inject: [LISTAR_OBRAS_SERVICE],
      useFactory: (
        listarObras: IListarObrasUseCase,
      ): IGerarRelatorioListaObrasPrivadasUseCase =>
        new GerarRelatorioListaObrasPrivadasService(listarObras),
    },
    {
      provide: GERAR_DOSSIE_OBRA_PRIVADA_SERVICE,
      inject: [
        DETALHAR_OBRA_SERVICE,
        ALVARA_REPOSITORY,
        FISCALIZACAO_REPOSITORY,
        AUTO_INFRACAO_REPOSITORY,
        HABITE_SE_REPOSITORY,
        OBRA_PRIVADA_OBSERVACAO_REPOSITORY,
      ],
      useFactory: (
        detalharObra: IDetalharObraUseCase,
        alvaras: IAlvaraRepository,
        fiscalizacoes: IFiscalizacaoRepository,
        autos: IAutoInfracaoRepository,
        habiteSe: IHabiteSeRepository,
        observacoes: IObraPrivadaObservacaoRepository,
      ): IGerarDossieObraPrivadaUseCase =>
        new GerarDossieObraPrivadaService(
          detalharObra,
          alvaras,
          fiscalizacoes,
          autos,
          habiteSe,
          observacoes,
        ),
    },
    {
      provide: GERAR_RELATORIO_FISCALIZACAO_PRIVADA_SERVICE,
      inject: [
        FISCALIZACAO_REPOSITORY,
        OBRA_PRIVADA_REPOSITORY,
        PESSOA_REPOSITORY,
        AUTO_INFRACAO_REPOSITORY,
      ],
      useFactory: (
        fiscalizacoes: IFiscalizacaoRepository,
        obras: IObraPrivadaRepository,
        pessoas: IPessoaRepository,
        autos: IAutoInfracaoRepository,
      ): IGerarRelatorioFiscalizacaoPrivadaUseCase =>
        new GerarRelatorioFiscalizacaoPrivadaService(
          fiscalizacoes,
          obras,
          pessoas,
          autos,
        ),
    },
  ],
  exports: [
    OBRA_PRIVADA_REPOSITORY,
    CREATE_OBRA_PRIVADA_SERVICE,
    LISTAR_OBRAS_SERVICE,
    DETALHAR_OBRA_SERVICE,
    ATUALIZAR_OBRA_SERVICE,
    EXCLUIR_OBRA_SERVICE,
    LISTAR_FISCALIZACOES_GLOBAL_SERVICE,
    LISTAR_AUTOS_GLOBAL_SERVICE,
    RESUMIR_AUTOS_SERVICE,
    LISTAR_LICENCIAMENTO_SERVICE,
    DETALHAR_FISCALIZACAO_SERVICE,
    ALVARA_REPOSITORY,
    CREATE_ALVARA_SERVICE,
    LIST_ALVARAS_SERVICE,
    UPDATE_ALVARA_SERVICE,
    DELETE_ALVARA_SERVICE,
    FISCALIZACAO_REPOSITORY,
    CREATE_FISCALIZACAO_SERVICE,
    LIST_FISCALIZACOES_SERVICE,
    UPDATE_FISCALIZACAO_SERVICE,
    DELETE_FISCALIZACAO_SERVICE,
    AUTO_INFRACAO_REPOSITORY,
    CREATE_AUTO_INFRACAO_SERVICE,
    LIST_AUTOS_INFRACAO_SERVICE,
    UPDATE_AUTO_INFRACAO_SERVICE,
    HABITE_SE_REPOSITORY,
    CREATE_HABITE_SE_SERVICE,
    LIST_HABITE_SE_SERVICE,
    UPDATE_HABITE_SE_SERVICE,
    DELETE_HABITE_SE_SERVICE,
    OBRA_PRIVADA_RESPONSAVEL_REPOSITORY,
    CREATE_OBRA_PRIVADA_RESPONSAVEL_SERVICE,
    LIST_OBRA_PRIVADA_RESPONSAVEIS_SERVICE,
    UPDATE_OBRA_PRIVADA_RESPONSAVEL_SERVICE,
    DELETE_OBRA_PRIVADA_RESPONSAVEL_SERVICE,
    OBRA_PRIVADA_OBSERVACAO_REPOSITORY,
    CREATE_OBRA_PRIVADA_OBSERVACAO_SERVICE,
    LIST_OBRA_PRIVADA_OBSERVACOES_SERVICE,
    DELETE_OBRA_PRIVADA_OBSERVACAO_SERVICE,
    LIST_OBRAS_NO_MESMO_IMOVEL_SERVICE,
    LIST_OBRA_PRIVADA_ETAPAS_SERVICE,
    LIST_OBRA_PRIVADA_TIMELINE_SERVICE,
    OBRA_PRIVADA_ARQUIVO_REPOSITORY,
    INICIAR_UPLOAD_ARQUIVO_SERVICE,
    CONFIRMAR_UPLOAD_ARQUIVO_SERVICE,
    LISTAR_ARQUIVOS_SERVICE,
    OBTER_ARQUIVO_DOWNLOAD_URL_SERVICE,
    EDITAR_ARQUIVO_SERVICE,
    EXCLUIR_ARQUIVO_SERVICE,
  ],
})
export default class ObrasPrivadasModule {}
