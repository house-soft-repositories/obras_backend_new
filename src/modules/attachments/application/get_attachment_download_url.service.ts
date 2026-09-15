import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IAttachmentRepository from '@/modules/attachments/adapters/attachment_repository.interface';
import IStorageService from '@/modules/storage/adapters/storage_service.interface';
import IGetAttachmentDownloadUrlUseCase, {
  AttachmentDownloadUrl,
  GetAttachmentDownloadUrlParam,
} from '@/modules/attachments/domain/usecase/get_attachment_download_url.usecase';
import AttachmentServiceException from '@/modules/attachments/exceptions/attachment_service.exception';

export default class GetAttachmentDownloadUrlService implements IGetAttachmentDownloadUrlUseCase {
  constructor(
    private readonly repository: IAttachmentRepository,
    private readonly storage: IStorageService,
  ) {}

  async execute(
    param: GetAttachmentDownloadUrlParam,
  ): AsyncResult<AppException, AttachmentDownloadUrl> {
    try {
      const current = await this.repository.findById(param.id);
      if (current.isLeft()) return left(current.value);
      const url = await this.storage.getDownloadUrl(
        current.value.fileUrl,
        current.value.originalName,
      );
      if (url.isLeft()) return left(url.value);
      return right({
        attachmentId: current.value.id,
        fileUrl: current.value.fileUrl,
        downloadUrl: url.value,
      });
    } catch (error) {
      if (error instanceof AppException) return left(error);
      return left(
        new AttachmentServiceException({
          code: ErrorCodeConstants.ATTACHMENT_DOWNLOAD_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }
}
