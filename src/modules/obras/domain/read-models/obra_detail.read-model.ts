import ObraEntity from '@/modules/obras/domain/entities/obra.entity';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';

export interface ObraResponsavelReadModel {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export default interface ObraDetailReadModel {
  obra: ObraEntity;
  responsavel: ObraResponsavelReadModel | null;
}
