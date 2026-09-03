import ITokenService from '@/modules/auth/adapters/token_service.interface';

const mockTokenService = (): jest.Mocked<ITokenService> => ({
  signAccess: jest.fn(),
  signRefresh: jest.fn(),
  verifyAccess: jest.fn(),
  verifyRefresh: jest.fn(),
});

export default mockTokenService;
