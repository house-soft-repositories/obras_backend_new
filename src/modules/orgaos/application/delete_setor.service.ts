import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import ISetorRepository from '@/modules/orgaos/adapters/setor_repository.interface';
import { denyUnlessSetorWriter } from '@/modules/orgaos/application/orgao_authorization';
import IDeleteSetorUseCase, {
  DeleteSetorParam,
} from '@/modules/orgaos/domain/usecase/delete_setor.usecase';
import SetorServiceException from '@/modules/orgaos/exceptions/setor_service.exception';

export default class DeleteSetorService implements IDeleteSetorUseCase {
  constructor(private readonly repository: ISetorRepository) {}

  async execute(param: DeleteSetorParam): AsyncResult<AppException, void> {
    try {
      const denied = denyUnlessSetorWriter(param.role);
      if (denied) return left(denied);
      const found = await this.repository.findById(param.id);
      if (found.isLeft()) return left(found.value);

      const users = await this.repository.countLinkedUsers(param.id);
      if (users.isLeft()) return left(users.value);
      if (users.value > 0) {
        return left(
          new SetorServiceException({
            code: ErrorCodeConstants.SETOR_HAS_LINKED_USERS,
            statusCode: 409,
          }),
        );
      }

      const obras = await this.repository.countLinkedObras(param.id);
      if (obras.isLeft()) return left(obras.value);
      if (obras.value > 0) {
        return left(
          new SetorServiceException({
            code: ErrorCodeConstants.SETOR_HAS_LINKED_OBRAS,
            statusCode: 409,
          }),
        );
      }

      const removed = await this.repository.delete(param.id);
      if (removed.isLeft()) return left(removed.value);
      return right(undefined);
    } catch (error) {
      return left(
        new SetorServiceException({
          code: ErrorCodeConstants.SETOR_DELETE_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }
}
