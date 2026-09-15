import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import { unit, type Unit } from '@/core/types/unit';
import IAttachmentRepository from '@/modules/attachments/adapters/attachment_repository.interface';
import IStorageService from '@/modules/storage/adapters/storage_service.interface';
import IDeleteAttachmentUseCase, {
  DeleteAttachmentParam,
} from '@/modules/attachments/domain/usecase/delete_attachment.usecase';
import AttachmentServiceException from '@/modules/attachments/exceptions/attachment_service.exception';

export default class DeleteAttachmentService implements IDeleteAttachmentUseCase {
  constructor(
    private readonly repository: IAttachmentRepository,
    private readonly storage: IStorageService,
  ) {}

  async execute(param: DeleteAttachmentParam): AsyncResult<AppException, Unit> {
    try {
      const current = await this.repository.findById(param.id);
      if (current.isLeft()) return left(current.value);
      const deleted = await this.repository.deleteById(param.id);
      if (deleted.isLeft()) return left(deleted.value);
      await this.storage.removeObject(current.value.fileUrl);
      return right(unit);
    } catch (error) {
      if (error instanceof AppException) return left(error);
      return left(
        new AttachmentServiceException({
          code: ErrorCodeConstants.ATTACHMENT_DELETE_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }
}
