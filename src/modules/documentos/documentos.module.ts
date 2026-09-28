import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import CoreModule from '@/core/core.module';
import TenantContext from '@/core/multitenancy/tenant_context';
import TenantSchemaResolver from '@/core/multitenancy/tenant_schema_resolver';
import AuthModule from '@/modules/auth/auth.module';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import type IAttachmentRepository from '@/modules/attachments/adapters/attachment_repository.interface';
import AttachmentsModule from '@/modules/attachments/attachments.module';
import { ATTACHMENT_REPOSITORY } from '@/modules/attachments/symbols';
import IArquivoRepository from '@/modules/documentos/adapters/arquivo_repository.interface';
import IPastaRepository from '@/modules/documentos/adapters/pasta_repository.interface';
import ConfirmarUploadService from '@/modules/documentos/application/confirmar_upload.service';
import ContarArquivosService from '@/modules/documentos/application/contar_arquivos.service';
import CriarPastaService from '@/modules/documentos/application/criar_pasta.service';
import DuplicarArvoreService from '@/modules/documentos/application/duplicar_arvore.service';
import EditarArquivoService from '@/modules/documentos/application/editar_arquivo.service';
import GarantirPastaRaizService from '@/modules/documentos/application/garantir_pasta_raiz.service';
import GerarDownloadService from '@/modules/documentos/application/gerar_download.service';
import IniciarUploadService from '@/modules/documentos/application/iniciar_upload.service';
import ListarConteudoService from '@/modules/documentos/application/listar_conteudo.service';
import MoverArquivoService from '@/modules/documentos/application/mover_arquivo.service';
import RemoverArquivoService from '@/modules/documentos/application/remover_arquivo.service';
import RemoverPastaService from '@/modules/documentos/application/remover_pasta.service';
import UploadDiretoService from '@/modules/documentos/application/upload_direto.service';
import ArquivosController from '@/modules/documentos/controller/arquivos.controller';
import PastasController from '@/modules/documentos/controller/pastas.controller';
import type IConfirmarUploadUseCase from '@/modules/documentos/domain/usecase/confirmar_upload.usecase';
import type IContarArquivosUseCase from '@/modules/documentos/domain/usecase/contar_arquivos.usecase';
import type ICriarPastaUseCase from '@/modules/documentos/domain/usecase/criar_pasta.usecase';
import type IDuplicarArvoreUseCase from '@/modules/documentos/domain/usecase/duplicar_arvore.usecase';
import type IEditarArquivoUseCase from '@/modules/documentos/domain/usecase/editar_arquivo.usecase';
import type IGarantirPastaRaizUseCase from '@/modules/documentos/domain/usecase/garantir_pasta_raiz.usecase';
import type IGerarDownloadUseCase from '@/modules/documentos/domain/usecase/gerar_download.usecase';
import type IIniciarUploadUseCase from '@/modules/documentos/domain/usecase/iniciar_upload.usecase';
import type IListarConteudoUseCase from '@/modules/documentos/domain/usecase/listar_conteudo.usecase';
import type IMoverArquivoUseCase from '@/modules/documentos/domain/usecase/mover_arquivo.usecase';
import type IRemoverArquivoUseCase from '@/modules/documentos/domain/usecase/remover_arquivo.usecase';
import type IRemoverPastaUseCase from '@/modules/documentos/domain/usecase/remover_pasta.usecase';
import type IUploadDiretoUseCase from '@/modules/documentos/domain/usecase/upload_direto.usecase';
import ArquivoModel from '@/modules/documentos/infra/models/arquivo.model';
import PastaModel from '@/modules/documentos/infra/models/pasta.model';
import ArquivoRepository from '@/modules/documentos/infra/repositories/arquivo.repository';
import PastaRepository from '@/modules/documentos/infra/repositories/pasta.repository';
import ObraCriadaListener from '@/modules/documentos/listeners/obra_criada.listener';
import ObraDuplicadaListener from '@/modules/documentos/listeners/obra_duplicada.listener';
import type ObraEventsService from '@/modules/obras/events/obra_events.service';
import ObrasModule from '@/modules/obras/obras.module';
import { OBRA_EVENTS } from '@/modules/obras/symbols';
import type IStorageService from '@/modules/storage/adapters/storage_service.interface';
import StorageModule from '@/modules/storage/storage.module';
import { STORAGE_SERVICE } from '@/modules/storage/symbols';
import {
  ARQUIVO_REPOSITORY,
  CONFIRMAR_UPLOAD_SERVICE,
  CONTAR_ARQUIVOS_SERVICE,
  CRIAR_PASTA_SERVICE,
  DUPLICAR_ARVORE_SERVICE,
  EDITAR_ARQUIVO_SERVICE,
  GARANTIR_PASTA_RAIZ_SERVICE,
  GERAR_DOWNLOAD_SERVICE,
  INICIAR_UPLOAD_SERVICE,
  LISTAR_CONTEUDO_SERVICE,
  MOVER_ARQUIVO_SERVICE,
  PASTA_REPOSITORY,
  REMOVER_ARQUIVO_SERVICE,
  REMOVER_PASTA_SERVICE,
  UPLOAD_DIRETO_SERVICE,
} from '@/modules/documentos/symbols';

@Module({
  imports: [
    CoreModule,
    AuthModule,
    StorageModule,
    AttachmentsModule,
    ObrasModule,
    TypeOrmModule.forFeature([PastaModel, ArquivoModel]),
  ],
  controllers: [PastasController, ArquivosController],
  providers: [
    AccessTokenGuard,
    {
      provide: PASTA_REPOSITORY,
      inject: [DataSource, TenantContext],
      useFactory: (ds: DataSource, tc: TenantContext): IPastaRepository =>
        new PastaRepository(ds, tc),
    },
    {
      provide: ARQUIVO_REPOSITORY,
      inject: [DataSource, TenantContext],
      useFactory: (ds: DataSource, tc: TenantContext): IArquivoRepository =>
        new ArquivoRepository(ds, tc),
    },
    {
      provide: GARANTIR_PASTA_RAIZ_SERVICE,
      inject: [PASTA_REPOSITORY],
      useFactory: (r: IPastaRepository): IGarantirPastaRaizUseCase =>
        new GarantirPastaRaizService(r),
    },
    {
      provide: CRIAR_PASTA_SERVICE,
      inject: [PASTA_REPOSITORY],
      useFactory: (r: IPastaRepository): ICriarPastaUseCase =>
        new CriarPastaService(r),
    },
    {
      provide: LISTAR_CONTEUDO_SERVICE,
      inject: [PASTA_REPOSITORY, ARQUIVO_REPOSITORY],
      useFactory: (
        pastas: IPastaRepository,
        arquivos: IArquivoRepository,
      ): IListarConteudoUseCase => new ListarConteudoService(pastas, arquivos),
    },
    {
      provide: INICIAR_UPLOAD_SERVICE,
      inject: [
        PASTA_REPOSITORY,
        ARQUIVO_REPOSITORY,
        ATTACHMENT_REPOSITORY,
        STORAGE_SERVICE,
        TenantContext,
      ],
      useFactory: (
        pastas: IPastaRepository,
        arquivos: IArquivoRepository,
        attachments: IAttachmentRepository,
        storage: IStorageService,
        tc: TenantContext,
      ): IIniciarUploadUseCase =>
        new IniciarUploadService(pastas, arquivos, attachments, storage, tc),
    },
    {
      provide: UPLOAD_DIRETO_SERVICE,
      inject: [
        PASTA_REPOSITORY,
        ARQUIVO_REPOSITORY,
        ATTACHMENT_REPOSITORY,
        STORAGE_SERVICE,
        TenantContext,
      ],
      useFactory: (
        pastas: IPastaRepository,
        arquivos: IArquivoRepository,
        attachments: IAttachmentRepository,
        storage: IStorageService,
        tc: TenantContext,
      ): IUploadDiretoUseCase =>
        new UploadDiretoService(pastas, arquivos, attachments, storage, tc),
    },
    {
      provide: CONFIRMAR_UPLOAD_SERVICE,
      inject: [ARQUIVO_REPOSITORY, ATTACHMENT_REPOSITORY],
      useFactory: (
        arquivos: IArquivoRepository,
        attachments: IAttachmentRepository,
      ): IConfirmarUploadUseCase =>
        new ConfirmarUploadService(arquivos, attachments),
    },
    {
      provide: GERAR_DOWNLOAD_SERVICE,
      inject: [ARQUIVO_REPOSITORY, STORAGE_SERVICE],
      useFactory: (
        arquivos: IArquivoRepository,
        storage: IStorageService,
      ): IGerarDownloadUseCase => new GerarDownloadService(arquivos, storage),
    },
    {
      provide: EDITAR_ARQUIVO_SERVICE,
      inject: [ARQUIVO_REPOSITORY, ATTACHMENT_REPOSITORY],
      useFactory: (
        arquivos: IArquivoRepository,
        attachments: IAttachmentRepository,
      ): IEditarArquivoUseCase =>
        new EditarArquivoService(arquivos, attachments),
    },
    {
      provide: MOVER_ARQUIVO_SERVICE,
      inject: [
        ARQUIVO_REPOSITORY,
        PASTA_REPOSITORY,
        ATTACHMENT_REPOSITORY,
        STORAGE_SERVICE,
        TenantContext,
      ],
      useFactory: (
        arquivos: IArquivoRepository,
        pastas: IPastaRepository,
        attachments: IAttachmentRepository,
        storage: IStorageService,
        tc: TenantContext,
      ): IMoverArquivoUseCase =>
        new MoverArquivoService(arquivos, pastas, attachments, storage, tc),
    },
    {
      provide: REMOVER_ARQUIVO_SERVICE,
      inject: [ARQUIVO_REPOSITORY, ATTACHMENT_REPOSITORY, STORAGE_SERVICE],
      useFactory: (
        arquivos: IArquivoRepository,
        attachments: IAttachmentRepository,
        storage: IStorageService,
      ): IRemoverArquivoUseCase =>
        new RemoverArquivoService(arquivos, attachments, storage),
    },
    {
      provide: REMOVER_PASTA_SERVICE,
      inject: [PASTA_REPOSITORY, ARQUIVO_REPOSITORY],
      useFactory: (
        pastas: IPastaRepository,
        arquivos: IArquivoRepository,
      ): IRemoverPastaUseCase => new RemoverPastaService(pastas, arquivos),
    },
    {
      provide: DUPLICAR_ARVORE_SERVICE,
      inject: [
        PASTA_REPOSITORY,
        ARQUIVO_REPOSITORY,
        ATTACHMENT_REPOSITORY,
        STORAGE_SERVICE,
        TenantContext,
      ],
      useFactory: (
        pastas: IPastaRepository,
        arquivos: IArquivoRepository,
        attachments: IAttachmentRepository,
        storage: IStorageService,
        tc: TenantContext,
      ): IDuplicarArvoreUseCase =>
        new DuplicarArvoreService(pastas, arquivos, attachments, storage, tc),
    },
    {
      provide: CONTAR_ARQUIVOS_SERVICE,
      inject: [ARQUIVO_REPOSITORY],
      useFactory: (arquivos: IArquivoRepository): IContarArquivosUseCase =>
        new ContarArquivosService(arquivos),
    },
    {
      provide: ObraCriadaListener,
      inject: [
        OBRA_EVENTS,
        TenantContext,
        TenantSchemaResolver,
        GARANTIR_PASTA_RAIZ_SERVICE,
      ],
      useFactory: (
        events: ObraEventsService,
        tc: TenantContext,
        resolver: TenantSchemaResolver,
        garantir: IGarantirPastaRaizUseCase,
      ): ObraCriadaListener =>
        new ObraCriadaListener(events, tc, resolver, garantir),
    },
    {
      provide: ObraDuplicadaListener,
      inject: [
        OBRA_EVENTS,
        TenantContext,
        TenantSchemaResolver,
        DUPLICAR_ARVORE_SERVICE,
      ],
      useFactory: (
        events: ObraEventsService,
        tc: TenantContext,
        resolver: TenantSchemaResolver,
        duplicar: IDuplicarArvoreUseCase,
      ): ObraDuplicadaListener =>
        new ObraDuplicadaListener(events, tc, resolver, duplicar),
    },
  ],
  exports: [
    PASTA_REPOSITORY,
    ARQUIVO_REPOSITORY,
    GARANTIR_PASTA_RAIZ_SERVICE,
    CRIAR_PASTA_SERVICE,
    LISTAR_CONTEUDO_SERVICE,
    INICIAR_UPLOAD_SERVICE,
    UPLOAD_DIRETO_SERVICE,
    CONFIRMAR_UPLOAD_SERVICE,
    GERAR_DOWNLOAD_SERVICE,
    EDITAR_ARQUIVO_SERVICE,
    MOVER_ARQUIVO_SERVICE,
    REMOVER_ARQUIVO_SERVICE,
    REMOVER_PASTA_SERVICE,
    DUPLICAR_ARVORE_SERVICE,
    CONTAR_ARQUIVOS_SERVICE,
  ],
})
export default class DocumentosModule {}
