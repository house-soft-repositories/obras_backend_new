import IArquivoRepository from '@/modules/documentos/adapters/arquivo_repository.interface';

export default function mockArquivoRepository(): jest.Mocked<IArquivoRepository> {
  return {
    save: jest.fn(),
    findById: jest.fn(),
    findByPastaId: jest.fn(),
    countByPastaId: jest.fn(),
    findByObraId: jest.fn(),
    countByObraId: jest.fn(),
    deleteById: jest.fn(),
  };
}
