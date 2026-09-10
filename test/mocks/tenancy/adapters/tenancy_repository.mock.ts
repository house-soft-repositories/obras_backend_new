import { right } from '@/core/types/either';
import ITenancyRepository from '@/modules/tenancy/adapters/tenancy_repository.interface';

const mockTenancyRepository = (): jest.Mocked<ITenancyRepository> => ({
  existsBySlugOrCnpj: jest.fn().mockResolvedValue(right(false)),
  provision: jest.fn(),
  findAll: jest.fn(),
});

export default mockTenancyRepository;
