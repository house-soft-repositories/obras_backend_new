import type UseCase from '@/core/types/use_case';
import TenancyEntity from '@/modules/tenancy/domain/entities/tenancy.entity';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';

export interface CreateTenancyParam {
  name: string;
  slug: string;
  cnpj: string | null;
  creator: {
    id: string;
    role: UserRole;
  };
}

type ICreateTenancyUseCase = UseCase<CreateTenancyParam, TenancyEntity>;

export default ICreateTenancyUseCase;
