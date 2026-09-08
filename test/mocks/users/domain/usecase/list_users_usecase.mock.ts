import IListUsersUseCase from '@/modules/users/domain/usecase/list_users.usecase';

const mockListUsersUseCase = (): jest.Mocked<IListUsersUseCase> => ({
  execute: jest.fn(),
});

export default mockListUsersUseCase;
