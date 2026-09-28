import IPastaRepository from '@/modules/documentos/adapters/pasta_repository.interface';

export default function mockPastaRepository(): jest.Mocked<IPastaRepository> {
  return {
    save: jest.fn(),
    findById: jest.fn(),
    findRootByObraId: jest.fn(),
    findChildren: jest.fn(),
    findByObraId: jest.fn(),
    findSiblingByName: jest.fn(),
    deleteById: jest.fn(),
  };
}
