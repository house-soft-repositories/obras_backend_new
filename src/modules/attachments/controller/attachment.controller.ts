import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import type { Either } from '@/core/types/either';
import AppException from '@/core/exceptions/app_exception';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import AuthenticatedUser from '@/modules/auth/controller/authenticated_user.decorator';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import type BaseFileInterface from '@/modules/attachments/domain/base_file.interface';
import type IDeleteAttachmentUseCase from '@/modules/attachments/domain/usecase/delete_attachment.usecase';
import type IGetAttachmentDownloadUrlUseCase from '@/modules/attachments/domain/usecase/get_attachment_download_url.usecase';
import type IReplaceAttachmentUseCase from '@/modules/attachments/domain/usecase/replace_attachment.usecase';
import type IUploadAttachmentUseCase from '@/modules/attachments/domain/usecase/upload_attachment.usecase';
import type IUploadAttachmentsBatchUseCase from '@/modules/attachments/domain/usecase/upload_attachments_batch.usecase';
import AttachmentResponseDto from '@/modules/attachments/dtos/attachment_response.dto';
import UploadAttachmentDto from '@/modules/attachments/dtos/upload_attachment.dto';
import {
  DELETE_ATTACHMENT_SERVICE,
  GET_ATTACHMENT_DOWNLOAD_URL_SERVICE,
  REPLACE_ATTACHMENT_SERVICE,
  UPLOAD_ATTACHMENT_SERVICE,
  UPLOAD_ATTACHMENTS_BATCH_SERVICE,
} from '@/modules/attachments/symbols';

const memoryUpload = { storage: memoryStorage() };

function toBaseFile(file: Express.Multer.File): BaseFileInterface {
  return {
    buffer: file.buffer,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    encoding: file.encoding,
  };
}

@Controller('api/attachments')
@UseGuards(AccessTokenGuard)
export default class AttachmentController {
  constructor(
    @Inject(UPLOAD_ATTACHMENT_SERVICE)
    private readonly upload: IUploadAttachmentUseCase,
    @Inject(UPLOAD_ATTACHMENTS_BATCH_SERVICE)
    private readonly uploadBatch: IUploadAttachmentsBatchUseCase,
    @Inject(REPLACE_ATTACHMENT_SERVICE)
    private readonly replace: IReplaceAttachmentUseCase,
    @Inject(DELETE_ATTACHMENT_SERVICE)
    private readonly remove: IDeleteAttachmentUseCase,
    @Inject(GET_ATTACHMENT_DOWNLOAD_URL_SERVICE)
    private readonly downloadUrl: IGetAttachmentDownloadUrlUseCase,
    private readonly tenantContext: TenantRequestContextService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', memoryUpload))
  async uploadAttachment(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadAttachmentDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const result = await this.upload.execute({
        file: toBaseFile(file),
        entityType: body.entityType,
        entityId: body.entityId,
        actorId: user?.sub ?? '',
      });
      return AttachmentResponseDto.fromEntity(this.unwrap(result));
    });
  }

  @Post('batch')
  @UseInterceptors(FilesInterceptor('files', 20, memoryUpload))
  async uploadAttachmentsBatch(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: UploadAttachmentDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const result = await this.uploadBatch.execute({
        files: (files ?? []).map(toBaseFile),
        entityType: body.entityType,
        entityId: body.entityId,
        actorId: user?.sub ?? '',
      });
      return this.unwrap(result).map((entity) =>
        AttachmentResponseDto.fromEntity(entity),
      );
    });
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('file', memoryUpload))
  async replaceAttachment(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UploadedFile() file: Express.Multer.File,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const result = await this.replace.execute({
        id,
        file: toBaseFile(file),
        actorId: user?.sub ?? '',
      });
      return AttachmentResponseDto.fromEntity(this.unwrap(result));
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAttachment(
    @Param('id', new ParseUUIDPipe()) id: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const result = await this.remove.execute({ id });
      this.unwrap(result);
      return;
    });
  }

  @Get(':id/download')
  async getDownloadUrl(
    @Param('id', new ParseUUIDPipe()) id: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const result = await this.downloadUrl.execute({ id });
      return this.unwrap(result);
    });
  }

  private async withTenant<T>(
    user: AccessTokenPayload | undefined,
    callback: () => Promise<T>,
  ): Promise<T> {
    try {
      return await this.tenantContext.run(user, callback);
    } catch (error) {
      if (error instanceof AppException) this.throwHttp(error);
      throw error;
    }
  }

  private unwrap<T>(result: Either<AppException, T>): T {
    if (result.isLeft()) this.throwHttp(result.value);
    return result.value;
  }

  private throwHttp(error: AppException): never {
    throw new HttpException(error.message, error.statusCode, {
      cause: error.cause,
    });
  }
}
