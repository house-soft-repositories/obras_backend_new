import IAttachmentRepository from '@/modules/attachments/adapters/attachment_repository.interface';

export default function mockAttachmentRepository(): jest.Mocked<IAttachmentRepository> {
  return {
    save: jest.fn(),
    saveMany: jest.fn(),
    findById: jest.fn(),
    deleteById: jest.fn(),
  };
}
