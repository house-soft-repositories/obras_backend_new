import ITenancyRepository from '@/modules/tenancy/adapters/tenancy_repository.interface';

const mockTenancyRepository = (): jest.Mocked<ITenancyRepository> => ({
  provision: jest.fn(),
});

export default mockTenancyRepository;
