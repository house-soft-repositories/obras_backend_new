import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import IAttachmentRepository from '@/modules/attachments/adapters/attachment_repository.interface';
import IStorageService from '@/modules/storage/adapters/storage_service.interface';
import type BaseFileInterface from '@/modules/attachments/domain/base_file.interface';
import AttachmentEntity from '@/modules/attachments/domain/entities/attachment.entity';
import IUploadAttachmentUseCase, {
  UploadAttachmentParam,
} from '@/modules/attachments/domain/usecase/upload_attachment.usecase';
import AttachmentDomainException from '@/modules/attachments/exceptions/attachment_domain.exception';
import AttachmentServiceException from '@/modules/attachments/exceptions/attachment_service.exception';
import { buildStorageKey } from '@/modules/storage/infra/storage/storage_key';

export function assertReadableFile(file: BaseFileInterface): void {
  if (!file?.buffer?.length || !file.size)
    throw new AttachmentDomainException({
      code: ErrorCodeConstants.ATTACHMENT_INVALID_FILE,
    });
}

export default class UploadAttachmentService implements IUploadAttachmentUseCase {
  constructor(
    private readonly repository: IAttachmentRepository,
    private readonly storage: IStorageService,
    private readonly tenantContext: TenantContext,
  ) {}

  async execute(
    param: UploadAttachmentParam,
  ): AsyncResult<AppException, AttachmentEntity> {
    try {
      assertReadableFile(param.file);
      const prefix = this.tenantContext.require().schemaName;
      const key = buildStorageKey(
        prefix,
        param.entityType,
        param.entityId,
        param.file.originalName,
      );
      const uploaded = await this.storage.putObject({
        key,
        buffer: param.file.buffer,
        mimetype: param.file.mimetype,
        size: param.file.size,
      });
      if (uploaded.isLeft()) return left(uploaded.value);

      const entity = AttachmentEntity.create({
        fileUrl: uploaded.value,
        originalName: param.file.originalName,
        entityType: param.entityType,
        entityId: param.entityId,
        createdBy: param.actorId,
      });
      const saved = await this.repository.save(entity);
      if (saved.isLeft()) {
        await this.storage.removeObject(uploaded.value);
        return left(saved.value);
      }
      return saved;
    } catch (error) {
      if (error instanceof AttachmentDomainException) return left(error);
      if (error instanceof AppException) return left(error);
      return left(
        new AttachmentServiceException({
          code: ErrorCodeConstants.ATTACHMENT_UPLOAD_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }
}
