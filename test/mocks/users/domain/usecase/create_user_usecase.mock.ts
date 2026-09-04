import ICreateUserUseCase from '@/modules/users/domain/usecase/create_user.usecase';

const mockCreateUserUseCase = (): jest.Mocked<ICreateUserUseCase> => ({
  execute: jest.fn(),
});

export default mockCreateUserUseCase;
