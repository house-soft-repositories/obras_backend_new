import IRefreshTokenUseCase from '@/modules/auth/domain/usecase/refresh_token.usecase';

const mockRefreshTokenUseCase = (): jest.Mocked<IRefreshTokenUseCase> => ({
  execute: jest.fn(),
});

export default mockRefreshTokenUseCase;
