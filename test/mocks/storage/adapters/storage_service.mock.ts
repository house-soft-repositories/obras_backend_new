import IStorageService from '@/modules/storage/adapters/storage_service.interface';

export default function mockStorageService(): jest.Mocked<IStorageService> {
  return {
    ensureBucket: jest.fn(),
    ensureTenantPrefix: jest.fn(),
    putObject: jest.fn(),
    getDownloadUrl: jest.fn(),
    removeObject: jest.fn(),
    copyObject: jest.fn(),
  };
}
