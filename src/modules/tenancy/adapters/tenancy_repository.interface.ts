import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import TenancyEntity from '@/modules/tenancy/domain/entities/tenancy.entity';
import TenancyReadModel from '@/modules/tenancy/domain/read_models/tenancy.read_model';

export default interface ITenancyRepository {
  provision(tenancy: TenancyEntity): AsyncResult<AppException, TenancyEntity>;
  findAll(): AsyncResult<AppException, TenancyReadModel[]>;
}
