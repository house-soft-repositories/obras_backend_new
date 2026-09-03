import ConfigurationService from '@/core/services/configuration.service';

const mockConfigurationService = (): jest.Mocked<ConfigurationService> => ({
  get: jest.fn((key: keyof { SALT: number; JWT_SECRET: string }) => {
    if (key === 'SALT') return 10;
    return 'test-jwt-secret';
  }),
});

export default mockConfigurationService;
