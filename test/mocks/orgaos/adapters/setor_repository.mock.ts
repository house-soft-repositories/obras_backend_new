import ISetorRepository from '@/modules/orgaos/adapters/setor_repository.interface';

export default function mockSetorRepository(): jest.Mocked<ISetorRepository> {
  return {
    save: jest.fn(),
    findById: jest.fn(),
    findAllByOrgao: jest.fn(),
    existsOrgao: jest.fn(),
  };
}
