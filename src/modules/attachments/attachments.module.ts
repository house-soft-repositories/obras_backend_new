import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import CoreModule from '@/core/core.module';
import TenantContext from '@/core/multitenancy/tenant_context';
import AuthModule from '@/modules/auth/auth.module';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import IAttachmentRepository from '@/modules/attachments/adapters/attachment_repository.interface';
import IStorageService from '@/modules/storage/adapters/storage_service.interface';
import DeleteAttachmentService from '@/modules/attachments/application/delete_attachment.service';
import GetAttachmentDownloadUrlService from '@/modules/attachments/application/get_attachment_download_url.service';
import ReplaceAttachmentService from '@/modules/attachments/application/replace_attachment.service';
import UploadAttachmentService from '@/modules/attachments/application/upload_attachment.service';
import UploadAttachmentsBatchService from '@/modules/attachments/application/upload_attachments_batch.service';
import AttachmentController from '@/modules/attachments/controller/attachment.controller';
import IDeleteAttachmentUseCase from '@/modules/attachments/domain/usecase/delete_attachment.usecase';
import IGetAttachmentDownloadUrlUseCase from '@/modules/attachments/domain/usecase/get_attachment_download_url.usecase';
import IReplaceAttachmentUseCase from '@/modules/attachments/domain/usecase/replace_attachment.usecase';
import IUploadAttachmentUseCase from '@/modules/attachments/domain/usecase/upload_attachment.usecase';
import IUploadAttachmentsBatchUseCase from '@/modules/attachments/domain/usecase/upload_attachments_batch.usecase';
import AttachmentModel from '@/modules/attachments/infra/models/attachment.model';
import AttachmentRepository from '@/modules/attachments/infra/repositories/attachment.repository';
import StorageModule from '@/modules/storage/storage.module';
import {
  ATTACHMENT_REPOSITORY,
  DELETE_ATTACHMENT_SERVICE,
  GET_ATTACHMENT_DOWNLOAD_URL_SERVICE,
  REPLACE_ATTACHMENT_SERVICE,
  UPLOAD_ATTACHMENT_SERVICE,
  UPLOAD_ATTACHMENTS_BATCH_SERVICE,
} from '@/modules/attachments/symbols';
import { STORAGE_SERVICE } from '@/modules/storage/symbols';

@Module({
  imports: [
    CoreModule,
    AuthModule,
    StorageModule,
    TypeOrmModule.forFeature([AttachmentModel]),
  ],
  controllers: [AttachmentController],
  providers: [
    AccessTokenGuard,
    {
      provide: ATTACHMENT_REPOSITORY,
      inject: [DataSource, TenantContext],
      useFactory: (ds: DataSource, tc: TenantContext): IAttachmentRepository =>
        new AttachmentRepository(ds, tc),
    },
    {
      provide: UPLOAD_ATTACHMENT_SERVICE,
      inject: [ATTACHMENT_REPOSITORY, STORAGE_SERVICE, TenantContext],
      useFactory: (
        r: IAttachmentRepository,
        s: IStorageService,
        tc: TenantContext,
      ): IUploadAttachmentUseCase => new UploadAttachmentService(r, s, tc),
    },
    {
      provide: UPLOAD_ATTACHMENTS_BATCH_SERVICE,
      inject: [ATTACHMENT_REPOSITORY, STORAGE_SERVICE, TenantContext],
      useFactory: (
        r: IAttachmentRepository,
        s: IStorageService,
        tc: TenantContext,
      ): IUploadAttachmentsBatchUseCase =>
        new UploadAttachmentsBatchService(r, s, tc),
    },
    {
      provide: REPLACE_ATTACHMENT_SERVICE,
      inject: [ATTACHMENT_REPOSITORY, STORAGE_SERVICE, TenantContext],
      useFactory: (
        r: IAttachmentRepository,
        s: IStorageService,
        tc: TenantContext,
      ): IReplaceAttachmentUseCase => new ReplaceAttachmentService(r, s, tc),
    },
    {
      provide: DELETE_ATTACHMENT_SERVICE,
      inject: [ATTACHMENT_REPOSITORY, STORAGE_SERVICE],
      useFactory: (
        r: IAttachmentRepository,
        s: IStorageService,
      ): IDeleteAttachmentUseCase => new DeleteAttachmentService(r, s),
    },
    {
      provide: GET_ATTACHMENT_DOWNLOAD_URL_SERVICE,
      inject: [ATTACHMENT_REPOSITORY, STORAGE_SERVICE],
      useFactory: (
        r: IAttachmentRepository,
        s: IStorageService,
      ): IGetAttachmentDownloadUrlUseCase =>
        new GetAttachmentDownloadUrlService(r, s),
    },
  ],
  exports: [
    ATTACHMENT_REPOSITORY,
    UPLOAD_ATTACHMENT_SERVICE,
    UPLOAD_ATTACHMENTS_BATCH_SERVICE,
    REPLACE_ATTACHMENT_SERVICE,
    DELETE_ATTACHMENT_SERVICE,
    GET_ATTACHMENT_DOWNLOAD_URL_SERVICE,
  ],
})
export default class AttachmentsModule {}
