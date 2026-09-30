import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import ILocalidadeRepository from '@/modules/localidades/adapters/localidade_repository.interface';
import { denyUnlessReader } from '@/modules/localidades/application/localidade_authorization';
import LocalidadeEntity from '@/modules/localidades/domain/entities/localidade.entity';
import IGetLocalidadeUseCase, {
  GetLocalidadeParam,
} from '@/modules/localidades/domain/usecase/get_localidade.usecase';
import LocalidadeServiceException from '@/modules/localidades/exceptions/localidade_service.exception';

export default class GetLocalidadeService implements IGetLocalidadeUseCase {
  constructor(private readonly repository: ILocalidadeRepository) {}

  async execute(
    param: GetLocalidadeParam,
  ): AsyncResult<AppException, LocalidadeEntity> {
    try {
      const denied = denyUnlessReader(param.role);
      if (denied) return left(denied);
      const found = await this.repository.findById(param.id);
      if (found.isLeft()) return left(found.value);
      return right(found.value);
    } catch (error) {
      return left(
        new LocalidadeServiceException({
          code: ErrorCodeConstants.LOCALIDADE_GET_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }
}
