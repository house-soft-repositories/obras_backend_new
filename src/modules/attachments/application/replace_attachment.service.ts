import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import IAttachmentRepository from '@/modules/attachments/adapters/attachment_repository.interface';
import IStorageService from '@/modules/storage/adapters/storage_service.interface';
import AttachmentEntity from '@/modules/attachments/domain/entities/attachment.entity';
import IReplaceAttachmentUseCase, {
  ReplaceAttachmentParam,
} from '@/modules/attachments/domain/usecase/replace_attachment.usecase';
import AttachmentDomainException from '@/modules/attachments/exceptions/attachment_domain.exception';
import AttachmentServiceException from '@/modules/attachments/exceptions/attachment_service.exception';
import { buildStorageKey } from '@/modules/storage/infra/storage/storage_key';
import { assertReadableFile } from '@/modules/attachments/application/upload_attachment.service';

export default class ReplaceAttachmentService implements IReplaceAttachmentUseCase {
  constructor(
    private readonly repository: IAttachmentRepository,
    private readonly storage: IStorageService,
    private readonly tenantContext: TenantContext,
  ) {}

  async execute(
    param: ReplaceAttachmentParam,
  ): AsyncResult<AppException, AttachmentEntity> {
    try {
      assertReadableFile(param.file);
      const current = await this.repository.findById(param.id);
      if (current.isLeft()) return left(current.value);
      const prefix = this.tenantContext.require().schemaName;
      const key = buildStorageKey(
        prefix,
        current.value.entityType,
        current.value.entityId,
        param.file.originalName,
      );
      const uploaded = await this.storage.putObject({
        key,
        buffer: param.file.buffer,
        mimetype: param.file.mimetype,
        size: param.file.size,
      });
      if (uploaded.isLeft()) return left(uploaded.value);

      const replaced = current.value.replaceFile(
        uploaded.value,
        param.file.originalName,
        param.actorId,
      );
      const saved = await this.repository.save(replaced);
      if (saved.isLeft()) {
        await this.storage.removeObject(uploaded.value);
        return left(saved.value);
      }
      if (current.value.fileUrl !== uploaded.value)
        await this.storage.removeObject(current.value.fileUrl);
      return saved;
    } catch (error) {
      if (error instanceof AttachmentDomainException) return left(error);
      if (error instanceof AppException) return left(error);
      return left(
        new AttachmentServiceException({
          code: ErrorCodeConstants.ATTACHMENT_REPLACE_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }
}
