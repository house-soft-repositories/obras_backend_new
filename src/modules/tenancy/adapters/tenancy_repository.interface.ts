import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import TenancyEntity from '@/modules/tenancy/domain/entities/tenancy.entity';

export default interface ITenancyRepository {
  provision(tenancy: TenancyEntity): AsyncResult<AppException, TenancyEntity>;
}
