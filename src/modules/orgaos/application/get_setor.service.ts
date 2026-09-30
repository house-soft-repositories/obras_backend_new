import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import ISetorRepository from '@/modules/orgaos/adapters/setor_repository.interface';
import { denyUnlessSetorReader } from '@/modules/orgaos/application/orgao_authorization';
import SetorEntity from '@/modules/orgaos/domain/entities/setor.entity';
import IGetSetorUseCase, {
  GetSetorParam,
} from '@/modules/orgaos/domain/usecase/get_setor.usecase';
import SetorServiceException from '@/modules/orgaos/exceptions/setor_service.exception';

export default class GetSetorService implements IGetSetorUseCase {
  constructor(private readonly repository: ISetorRepository) {}

  async execute(param: GetSetorParam): AsyncResult<AppException, SetorEntity> {
    try {
      const denied = denyUnlessSetorReader(param.role);
      if (denied) return left(denied);
      const found = await this.repository.findById(param.id);
      if (found.isLeft()) return left(found.value);
      return right(found.value);
    } catch (error) {
      return left(
        new SetorServiceException({
          code: ErrorCodeConstants.SETOR_GET_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }
}
