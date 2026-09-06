import type UseCase from '@/core/types/use_case';
import LocalidadeEntity, {
  CreateLocalidadeProps,
} from '@/modules/localidades/domain/entities/localidade.entity';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';

export type CreateLocalidadeParam = CreateLocalidadeProps & {
  role: UserRole;
};

type ICreateLocalidadeUseCase = UseCase<CreateLocalidadeParam, LocalidadeEntity>;

export default ICreateLocalidadeUseCase;
