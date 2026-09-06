import type UseCase from '@/core/types/use_case';
import SetorEntity from '@/modules/orgaos/domain/entities/setor.entity';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';

export interface ListSetoresParam {
  orgaoId: string;
  role: UserRole;
}

type IListSetoresUseCase = UseCase<ListSetoresParam, SetorEntity[]>;

export default IListSetoresUseCase;
