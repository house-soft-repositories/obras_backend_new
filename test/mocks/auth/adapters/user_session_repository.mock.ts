import IUserSessionRepository from '@/modules/auth/adapters/user_session_repository.interface';

const mockUserSessionRepository = (): jest.Mocked<IUserSessionRepository> => ({
  save: jest.fn(),
  findActiveById: jest.fn(),
  revoke: jest.fn(),
});

export default mockUserSessionRepository;
