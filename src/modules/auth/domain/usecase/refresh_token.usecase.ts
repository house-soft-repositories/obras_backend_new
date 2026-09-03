import type UseCase from '@/core/types/use_case';
import { TokenPairResponse } from '@/modules/auth/domain/usecase/login.usecase';

export interface RefreshTokenParam {
  refreshToken: string;
}

type IRefreshTokenUseCase = UseCase<RefreshTokenParam, TokenPairResponse>;

export default IRefreshTokenUseCase;
