import type UseCase from '@/core/types/use_case';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import type TenancyReadModel from '@/modules/tenancy/domain/read_models/tenancy.read_model';

export interface SwitchTenancyParam {
  user: AccessTokenPayload;
  tenantId: string;
}

export interface SwitchTenancyResponse {
  accessToken: string;
  tenancy: TenancyReadModel;
}

type ISwitchTenancyUseCase = UseCase<SwitchTenancyParam, SwitchTenancyResponse>;

export default ISwitchTenancyUseCase;
