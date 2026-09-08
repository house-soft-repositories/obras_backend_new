import PageEntity from '@/core/pagination/domain/entities/page.entity';
import type UseCase from '@/core/types/use_case';
import SetorEntity from '@/modules/orgaos/domain/entities/setor.entity';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';

export interface ListSetoresParam {
  orgaoId: string;
  order?: 'ASC' | 'DESC';
  page?: number;
  role: UserRole;
  take?: number;
}

type IListSetoresUseCase = UseCase<ListSetoresParam, PageEntity<SetorEntity>>;

export default IListSetoresUseCase;
