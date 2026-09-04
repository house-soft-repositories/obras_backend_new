import type { TenancyProps } from '@/modules/tenancy/domain/entities/tenancy.entity';

type TenancyReadModel = Pick<
  TenancyProps,
  'id' | 'name' | 'slug' | 'cnpj' | 'active' | 'createdAt' | 'updatedAt'
>;

export default TenancyReadModel;
