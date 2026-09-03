import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import ITenancyRepository from '@/modules/tenancy/adapters/tenancy_repository.interface';
import TenancyEntity from '@/modules/tenancy/domain/entities/tenancy.entity';
import ICreateTenancyUseCase, {
  CreateTenancyParam,
} from '@/modules/tenancy/domain/usecase/create_tenancy.usecase';
import TenancyDomainException from '@/modules/tenancy/exceptions/tenancy_domain.exception';
import TenancyServiceException from '@/modules/tenancy/exceptions/tenancy_service.exception';
import AppException from '@/core/exceptions/app_exception';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';

export default class CreateTenancyService implements ICreateTenancyUseCase {
  constructor(private readonly repository: ITenancyRepository) {}

  async execute(param: CreateTenancyParam): AsyncResult<AppException, TenancyEntity> {
    try {
      if (param.creator.role !== UserRole.SUPERADMIN) {
        return left(
          new TenancyServiceException({
            code: ErrorCodeConstants.TENANCY_CREATE_FORBIDDEN,
            statusCode: 403,
          }),
        );
      }
      return this.repository.provision(TenancyEntity.create(param));
    } catch (error) {
      if (error instanceof TenancyDomainException) return left(error);
      return left(
        new TenancyServiceException({
          code: ErrorCodeConstants.TENANCY_CREATE_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }
}
