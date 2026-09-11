import { UserRole } from '@/modules/users/domain/enums/user_role.enum';

export type MeTenantBrief = {
  id: string;
  name: string;
};

export type MeReadModel = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenant: MeTenantBrief | null;
  createdAt: Date;
  updatedAt: Date;
};

export default MeReadModel;
