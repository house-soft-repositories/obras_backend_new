import IOrgaoRepository from '@/modules/orgaos/adapters/orgao_repository.interface';

export default function mockOrgaoRepository(): jest.Mocked<IOrgaoRepository> {
  return {
    save: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    existsLocalidade: jest.fn(),
  };
}
