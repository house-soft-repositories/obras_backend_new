import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IPessoaRepository from '@/modules/pessoas/adapters/pessoa_repository.interface';
import IDeletePessoaUseCase, {
  DeletePessoaParam,
} from '@/modules/pessoas/domain/usecase/delete_pessoa.usecase';
import PessoaServiceException from '@/modules/pessoas/exceptions/pessoa_service.exception';

export default class DeletePessoaService implements IDeletePessoaUseCase {
  constructor(private readonly repository: IPessoaRepository) {}

  async execute(param: DeletePessoaParam): AsyncResult<AppException, void> {
    try {
      const found = await this.repository.findById(param.id);
      if (found.isLeft()) return left(found.value);
      if (!found.value) return left(this.notFound());

      const removed = await this.repository.delete(param.id);
      if (removed.isLeft()) return left(removed.value);
      return right(undefined);
    } catch (error) {
      if (error instanceof AppException) return left(error);
      return left(
        new PessoaServiceException({
          code: ErrorCodeConstants.PESSOA_DELETE_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }

  private notFound(): PessoaServiceException {
    return new PessoaServiceException({
      code: ErrorCodeConstants.PESSOA_NOT_FOUND,
      statusCode: 404,
    });
  }
}
