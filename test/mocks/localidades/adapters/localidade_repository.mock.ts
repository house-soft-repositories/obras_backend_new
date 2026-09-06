import ILocalidadeRepository from '@/modules/localidades/adapters/localidade_repository.interface';

export default function mockLocalidadeRepository(): jest.Mocked<ILocalidadeRepository> {
  return {
    save: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
  };
}
