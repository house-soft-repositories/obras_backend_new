import IPasswordHasher from '@/modules/auth/adapters/password_hasher.interface';

const mockPasswordHasher = (): jest.Mocked<IPasswordHasher> => ({
  hash: jest.fn(),
  compare: jest.fn(),
});

export default mockPasswordHasher;
