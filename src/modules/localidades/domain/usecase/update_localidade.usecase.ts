import type UseCase from '@/core/types/use_case';
import LocalidadeEntity, {
  UpdateLocalidadeProps,
} from '@/modules/localidades/domain/entities/localidade.entity';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';

export type UpdateLocalidadeParam = UpdateLocalidadeProps & {
  id: string;
  role: UserRole;
};

type IUpdateLocalidadeUseCase = UseCase<UpdateLocalidadeParam, LocalidadeEntity>;

export default IUpdateLocalidadeUseCase;
