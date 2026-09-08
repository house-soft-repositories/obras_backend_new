import type UseCase from '@/core/types/use_case';
import { SetorWithOrgaoReadModel } from '@/modules/orgaos/infra/read-models/setor_with_orgao_read_model';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';

export interface ListSetoresByOrgaoParam {
  orgaoId: string;
  role: UserRole;
}

type IListSetoresByOrgaoUseCase = UseCase<
  ListSetoresByOrgaoParam,
  SetorWithOrgaoReadModel[]
>;

export default IListSetoresByOrgaoUseCase;
