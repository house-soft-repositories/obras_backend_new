import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import ITenancyRepository from '@/modules/tenancy/adapters/tenancy_repository.interface';
import TenancyReadModel from '@/modules/tenancy/domain/read_models/tenancy.read_model';
import IListTenanciesUseCase from '@/modules/tenancy/domain/usecase/list_tenancies.usecase';
import TenancyServiceException from '@/modules/tenancy/exceptions/tenancy_service.exception';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';

export default class ListTenanciesService implements IListTenanciesUseCase {
  constructor(private readonly repository: ITenancyRepository) {}

  async execute({ role }: { role: UserRole }): AsyncResult<AppException, TenancyReadModel[]> {
    if (role !== UserRole.SUPERADMIN) {
      return left(new TenancyServiceException({ code: ErrorCodeConstants.TENANCY_LIST_FORBIDDEN, statusCode: 403 }));
    }
    return this.repository.findAll();
  }
}
