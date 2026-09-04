import ILoginUseCase from '@/modules/auth/domain/usecase/login.usecase';

const mockLoginUseCase = (): jest.Mocked<ILoginUseCase> => ({
  execute: jest.fn(),
});

export default mockLoginUseCase;
