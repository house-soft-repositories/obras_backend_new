import type UseCase from '@/core/types/use_case';

export interface LoginParam {
  email: string;
  password: string;
  tenantId: string | null;
}

export interface TokenPairResponse {
  accessToken: string;
  refreshToken: string;
}

type ILoginUseCase = UseCase<LoginParam, TokenPairResponse>;

export default ILoginUseCase;
