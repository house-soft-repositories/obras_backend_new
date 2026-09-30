import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IOrgaoRepository from '@/modules/orgaos/adapters/orgao_repository.interface';
import { denyUnlessOrgaoReader } from '@/modules/orgaos/application/orgao_authorization';
import OrgaoEntity from '@/modules/orgaos/domain/entities/orgao.entity';
import IGetOrgaoUseCase, {
  GetOrgaoParam,
} from '@/modules/orgaos/domain/usecase/get_orgao.usecase';
import OrgaoServiceException from '@/modules/orgaos/exceptions/orgao_service.exception';

export default class GetOrgaoService implements IGetOrgaoUseCase {
  constructor(private readonly repository: IOrgaoRepository) {}

  async execute(param: GetOrgaoParam): AsyncResult<AppException, OrgaoEntity> {
    try {
      const denied = denyUnlessOrgaoReader(param.role);
      if (denied) return left(denied);
      const found = await this.repository.findById(param.id);
      if (found.isLeft()) return left(found.value);
      return right(found.value);
    } catch (error) {
      return left(
        new OrgaoServiceException({
          code: ErrorCodeConstants.ORGAO_GET_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }
}
