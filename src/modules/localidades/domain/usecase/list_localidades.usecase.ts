import PageEntity from '@/core/pagination/domain/entities/page.entity';
import type UseCase from '@/core/types/use_case';
import LocalidadeEntity from '@/modules/localidades/domain/entities/localidade.entity';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';

export interface ListLocalidadesParam {
  order?: 'ASC' | 'DESC';
  page?: number;
  role: UserRole;
  take?: number;
}

type IListLocalidadesUseCase = UseCase<
  ListLocalidadesParam,
  PageEntity<LocalidadeEntity>
>;

export default IListLocalidadesUseCase;
