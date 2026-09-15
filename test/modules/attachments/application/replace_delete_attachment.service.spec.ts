import ErrorCodeConstants from '@/core/constants/error_code.constants';
import TenantContext from '@/core/multitenancy/tenant_context';
import { left, right } from '@/core/types/either';
import { unit } from '@/core/types/unit';
import DeleteAttachmentService from '@/modules/attachments/application/delete_attachment.service';
import ReplaceAttachmentService from '@/modules/attachments/application/replace_attachment.service';
import type BaseFileInterface from '@/modules/attachments/domain/base_file.interface';
import AttachmentEntity from '@/modules/attachments/domain/entities/attachment.entity';
import { ATTACHMENT_ENTITY_TYPE } from '@/modules/attachments/domain/enums/attachment_entity_type.enum';
import AttachmentRepositoryException from '@/modules/attachments/exceptions/attachment_repository.exception';
import mockAttachmentRepository from '@test/mocks/attachments/adapters/attachment_repository.mock';
import mockStorageService from '@test/mocks/storage/adapters/storage_service.mock';

describe('ReplaceAttachmentService', () => {
  const context = { tenantId: 'tenant-id', schemaName: 'tenant_abc123' };
  const entityId = '7b4c9e2a-1f3d-4a5b-8c6d-9e0f1a2b3c4d';
  const actorId = '3f2a1b4c-5d6e-4f70-a8b9-c0d1e2f3a4b5';
  const stored = AttachmentEntity.create({
    fileUrl: 'tenant_abc123/obra/antigo.pdf',
    originalName: 'antigo.pdf',
    entityType: ATTACHMENT_ENTITY_TYPE.OBRA,
    entityId,
    createdBy: actorId,
  });
  const file: BaseFileInterface = {
    buffer: Buffer.from('novo'),
    originalName: 'novo.pdf',
    mimetype: 'application/pdf',
    size: 4,
    encoding: '7bit',
  };

  it('uploads the new binary, persists and removes the old object', async () => {
    const repository = mockAttachmentRepository();
    const storage = mockStorageService();
    const tenantContext = new TenantContext();
    repository.findById.mockResolvedValue(right(stored));
    storage.putObject.mockImplementation(({ key }) =>
      Promise.resolve(right(key)),
    );
    storage.removeObject.mockResolvedValue(right(unit));
    repository.save.mockImplementation((entity) =>
      Promise.resolve(right(entity)),
    );
    const service = new ReplaceAttachmentService(
      repository,
      storage,
      tenantContext,
    );

    const result = await tenantContext.run(context, () =>
      service.execute({ id: stored.id, file, actorId }),
    );

    expect(result.isRight()).toBe(true);
    expect(result.getOrThrow().updatedBy).toBe(actorId);
    expect(storage.removeObject).toHaveBeenCalledWith(
      'tenant_abc123/obra/antigo.pdf',
    );
  });

  it('propagates not found without touching storage', async () => {
    const repository = mockAttachmentRepository();
    const storage = mockStorageService();
    repository.findById.mockResolvedValue(
      left(
        new AttachmentRepositoryException({
          code: ErrorCodeConstants.ATTACHMENT_NOT_FOUND,
          statusCode: 404,
        }),
      ),
    );
    const service = new ReplaceAttachmentService(
      repository,
      storage,
      new TenantContext(),
    );

    const result = await service.execute({ id: stored.id, file, actorId });

    expect(result.isLeft()).toBe(true);
    expect(storage.putObject).not.toHaveBeenCalled();
  });
});

describe('DeleteAttachmentService', () => {
  const stored = AttachmentEntity.create({
    fileUrl: 'tenant_abc123/obra/antigo.pdf',
    originalName: 'antigo.pdf',
    entityType: ATTACHMENT_ENTITY_TYPE.OBRA,
    entityId: '7b4c9e2a-1f3d-4a5b-8c6d-9e0f1a2b3c4d',
    createdBy: '3f2a1b4c-5d6e-4f70-a8b9-c0d1e2f3a4b5',
  });

  it('deletes metadata then removes the object', async () => {
    const repository = mockAttachmentRepository();
    const storage = mockStorageService();
    repository.findById.mockResolvedValue(right(stored));
    repository.deleteById.mockResolvedValue(right(unit));
    storage.removeObject.mockResolvedValue(right(unit));
    const service = new DeleteAttachmentService(repository, storage);

    const result = await service.execute({ id: stored.id });

    expect(result.isRight()).toBe(true);
    expect(repository.deleteById).toHaveBeenCalledWith(stored.id);
    expect(storage.removeObject).toHaveBeenCalledWith(stored.fileUrl);
  });
});
