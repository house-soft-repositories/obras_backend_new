import type UseCase from '@/core/types/use_case';
import LocalidadeEntity from '@/modules/localidades/domain/entities/localidade.entity';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';

export interface GetLocalidadeParam {
  id: string;
  role: UserRole;
}

type IGetLocalidadeUseCase = UseCase<GetLocalidadeParam, LocalidadeEntity>;

export default IGetLocalidadeUseCase;
