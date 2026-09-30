import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import ILocalidadeRepository from '@/modules/localidades/adapters/localidade_repository.interface';
import { denyUnlessWriter } from '@/modules/localidades/application/localidade_authorization';
import IDeleteLocalidadeUseCase, {
  DeleteLocalidadeParam,
} from '@/modules/localidades/domain/usecase/delete_localidade.usecase';
import LocalidadeServiceException from '@/modules/localidades/exceptions/localidade_service.exception';

export default class DeleteLocalidadeService implements IDeleteLocalidadeUseCase {
  constructor(private readonly repository: ILocalidadeRepository) {}

  async execute(
    param: DeleteLocalidadeParam,
  ): AsyncResult<AppException, void> {
    try {
      const denied = denyUnlessWriter(param.role);
      if (denied) return left(denied);
      const found = await this.repository.findById(param.id);
      if (found.isLeft()) return left(found.value);

      const orgaos = await this.repository.countOrgaos(param.id);
      if (orgaos.isLeft()) return left(orgaos.value);
      if (orgaos.value > 0) {
        return left(
          new LocalidadeServiceException({
            code: ErrorCodeConstants.LOCALIDADE_HAS_LINKED_ORGAOS,
            statusCode: 409,
          }),
        );
      }

      const users = await this.repository.countLinkedUsers(param.id);
      if (users.isLeft()) return left(users.value);
      if (users.value > 0) {
        return left(
          new LocalidadeServiceException({
            code: ErrorCodeConstants.LOCALIDADE_HAS_LINKED_USERS,
            statusCode: 409,
          }),
        );
      }

      const obras = await this.repository.countLinkedObras(param.id);
      if (obras.isLeft()) return left(obras.value);
      if (obras.value > 0) {
        return left(
          new LocalidadeServiceException({
            code: ErrorCodeConstants.LOCALIDADE_HAS_LINKED_OBRAS,
            statusCode: 409,
          }),
        );
      }

      const removed = await this.repository.delete(param.id);
      if (removed.isLeft()) return left(removed.value);
      return right(undefined);
    } catch (error) {
      return left(
        new LocalidadeServiceException({
          code: ErrorCodeConstants.LOCALIDADE_DELETE_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }
}
