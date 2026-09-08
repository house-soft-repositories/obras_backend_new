import IUserRepository from '@/modules/users/adapters/user_repository.interface';

const mockUserRepository = (): jest.Mocked<IUserRepository> =>
  ({
    findOne: jest.fn(),
    findById: jest.fn(),
    listByTenantId: jest.fn(),
    save: jest.fn(),
    existsLocalidade: jest.fn(),
    existsOrgao: jest.fn(),
    findSetorById: jest.fn(),
  });

export default mockUserRepository;
