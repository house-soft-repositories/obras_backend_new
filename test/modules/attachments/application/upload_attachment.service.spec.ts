import ErrorCodeConstants from '@/core/constants/error_code.constants';
import TenantContext from '@/core/multitenancy/tenant_context';
import { left, right } from '@/core/types/either';
import { unit } from '@/core/types/unit';
import UploadAttachmentService from '@/modules/attachments/application/upload_attachment.service';
import type BaseFileInterface from '@/modules/attachments/domain/base_file.interface';
import AttachmentEntity from '@/modules/attachments/domain/entities/attachment.entity';
import { ATTACHMENT_ENTITY_TYPE } from '@/modules/attachments/domain/enums/attachment_entity_type.enum';
import AttachmentRepositoryException from '@/modules/attachments/exceptions/attachment_repository.exception';
import mockAttachmentRepository from '@test/mocks/attachments/adapters/attachment_repository.mock';
import mockStorageService from '@test/mocks/storage/adapters/storage_service.mock';

describe('UploadAttachmentService', () => {
  const context = { tenantId: 'tenant-id', schemaName: 'tenant_abc123' };
  const entityId = '7b4c9e2a-1f3d-4a5b-8c6d-9e0f1a2b3c4d';
  const actorId = '3f2a1b4c-5d6e-4f70-a8b9-c0d1e2f3a4b5';
  const file: BaseFileInterface = {
    buffer: Buffer.from('conteudo'),
    originalName: 'doc.pdf',
    mimetype: 'application/pdf',
    size: 8,
    encoding: '7bit',
  };
  const param = {
    file,
    entityType: ATTACHMENT_ENTITY_TYPE.OBRA,
    entityId,
    actorId,
  };

  it('uploads the binary then persists metadata namespaced by tenant', async () => {
    const repository = mockAttachmentRepository();
    const storage = mockStorageService();
    const tenantContext = new TenantContext();
    storage.putObject.mockImplementation(({ key }) =>
      Promise.resolve(right(key)),
    );
    repository.save.mockImplementation((entity) =>
      Promise.resolve(right(entity)),
    );
    const service = new UploadAttachmentService(
      repository,
      storage,
      tenantContext,
    );

    const result = await tenantContext.run(context, () =>
      service.execute(param),
    );

    expect(result.isRight()).toBe(true);
    const key = storage.putObject.mock.calls[0][0].key as string;
    expect(key.startsWith(`tenant_abc123/obra/${entityId}/`)).toBe(true);
    expect(repository.save.mock.calls[0][0]).toBeInstanceOf(AttachmentEntity);
    expect(storage.removeObject).not.toHaveBeenCalled();
  });

  it('removes the uploaded object when metadata persistence fails', async () => {
    const repository = mockAttachmentRepository();
    const storage = mockStorageService();
    const tenantContext = new TenantContext();
    storage.putObject.mockImplementation(({ key }) =>
      Promise.resolve(right(key)),
    );
    storage.removeObject.mockResolvedValue(right(unit));
    repository.save.mockResolvedValue(
      left(
        new AttachmentRepositoryException({
          code: ErrorCodeConstants.ATTACHMENT_REPOSITORY_FAILED,
          statusCode: 500,
        }),
      ),
    );
    const service = new UploadAttachmentService(
      repository,
      storage,
      tenantContext,
    );

    const result = await tenantContext.run(context, () =>
      service.execute(param),
    );

    expect(result.isLeft()).toBe(true);
    expect(storage.removeObject).toHaveBeenCalledTimes(1);
    expect(storage.removeObject.mock.calls[0][0]).toBe(
      storage.putObject.mock.calls[0][0].key,
    );
  });

  it('rejects an empty file without touching storage', async () => {
    const repository = mockAttachmentRepository();
    const storage = mockStorageService();
    const service = new UploadAttachmentService(
      repository,
      storage,
      new TenantContext(),
    );

    const result = await service.execute({
      ...param,
      file: { ...file, buffer: Buffer.from(''), size: 0 },
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(ErrorCodeConstants.ATTACHMENT_INVALID_FILE);
    expect(storage.putObject).not.toHaveBeenCalled();
  });
});
