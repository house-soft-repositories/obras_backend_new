import ILocalidadeRepository from '@/modules/localidades/adapters/localidade_repository.interface';

export default function mockLocalidadeRepository(): jest.Mocked<ILocalidadeRepository> {
  return {
    save: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    delete: jest.fn(),
    countOrgaos: jest.fn(),
    countLinkedUsers: jest.fn(),
    countLinkedObras: jest.fn(),
  };
}
