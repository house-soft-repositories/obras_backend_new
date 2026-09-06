import type UseCase from '@/core/types/use_case';
import LocalidadeEntity from '@/modules/localidades/domain/entities/localidade.entity';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';

export interface ListLocalidadesParam {
  role: UserRole;
}

type IListLocalidadesUseCase = UseCase<ListLocalidadesParam, LocalidadeEntity[]>;

export default IListLocalidadesUseCase;
