import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IAttachmentRepository from '@/modules/attachments/adapters/attachment_repository.interface';
import IStorageService from '@/modules/storage/adapters/storage_service.interface';
import AttachmentEntity from '@/modules/attachments/domain/entities/attachment.entity';
import IUploadAttachmentsBatchUseCase, {
  UploadAttachmentsBatchParam,
} from '@/modules/attachments/domain/usecase/upload_attachments_batch.usecase';
import AttachmentDomainException from '@/modules/attachments/exceptions/attachment_domain.exception';
import AttachmentServiceException from '@/modules/attachments/exceptions/attachment_service.exception';
import { buildStorageKey } from '@/modules/storage/infra/storage/storage_key';
import { assertReadableFile } from '@/modules/attachments/application/upload_attachment.service';

export default class UploadAttachmentsBatchService implements IUploadAttachmentsBatchUseCase {
  constructor(
    private readonly repository: IAttachmentRepository,
    private readonly storage: IStorageService,
    private readonly tenantContext: TenantContext,
  ) {}

  async execute(
    param: UploadAttachmentsBatchParam,
  ): AsyncResult<AppException, AttachmentEntity[]> {
    const uploadedKeys: string[] = [];
    try {
      if (!param.files?.length)
        return left(
          new AttachmentServiceException({
            code: ErrorCodeConstants.ATTACHMENT_INVALID_FILE,
            statusCode: 400,
          }),
        );
      const prefix = this.tenantContext.require().schemaName;
      for (const file of param.files) {
        assertReadableFile(file);
        const key = buildStorageKey(
          prefix,
          param.entityType,
          param.entityId,
          file.originalName,
        );
        const uploaded = await this.storage.putObject({
          key,
          buffer: file.buffer,
          mimetype: file.mimetype,
          size: file.size,
        });
        if (uploaded.isLeft()) {
          await this.removeQuietly(uploadedKeys);
          return left(uploaded.value);
        }
        uploadedKeys.push(uploaded.value);
      }
      const entities = param.files.map((file, index) =>
        AttachmentEntity.create({
          fileUrl: uploadedKeys[index],
          originalName: param.files[index].originalName,
          entityType: param.entityType,
          entityId: param.entityId,
          createdBy: param.actorId,
        }),
      );
      const saved = await this.repository.saveMany(entities);
      if (saved.isLeft()) {
        await this.removeQuietly(uploadedKeys);
        return left(saved.value);
      }
      return right(saved.value);
    } catch (error) {
      await this.removeQuietly(uploadedKeys);
      if (error instanceof AttachmentDomainException) return left(error);
      if (error instanceof AppException) return left(error);
      return left(
        new AttachmentServiceException({
          code: ErrorCodeConstants.ATTACHMENT_BATCH_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }

  private async removeQuietly(keys: string[]): Promise<void> {
    for (const key of keys) await this.storage.removeObject(key);
  }
}
