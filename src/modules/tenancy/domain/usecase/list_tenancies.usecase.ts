import type UseCase from '@/core/types/use_case';
import TenancyReadModel from '@/modules/tenancy/domain/read_models/tenancy.read_model';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';

type IListTenanciesUseCase = UseCase<{ role: UserRole }, TenancyReadModel[]>;

export default IListTenanciesUseCase;
