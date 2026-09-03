import IUserRepository from '@/modules/users/adapters/user_repository.interface';

const mockUserRepository = (): jest.Mocked<IUserRepository> =>
  ({
    findOne: jest.fn(),
    findById: jest.fn(),
    save: jest.fn(),
  });

export default mockUserRepository;
