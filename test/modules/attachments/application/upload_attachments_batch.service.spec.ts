import ErrorCodeConstants from '@/core/constants/error_code.constants';
import TenantContext from '@/core/multitenancy/tenant_context';
import { left, right } from '@/core/types/either';
import { unit } from '@/core/types/unit';
import UploadAttachmentsBatchService from '@/modules/attachments/application/upload_attachments_batch.service';
import type BaseFileInterface from '@/modules/attachments/domain/base_file.interface';
import { ATTACHMENT_ENTITY_TYPE } from '@/modules/attachments/domain/enums/attachment_entity_type.enum';
import AttachmentRepositoryException from '@/modules/attachments/exceptions/attachment_repository.exception';
import mockAttachmentRepository from '@test/mocks/attachments/adapters/attachment_repository.mock';
import mockStorageService from '@test/mocks/storage/adapters/storage_service.mock';

describe('UploadAttachmentsBatchService', () => {
  const context = { tenantId: 'tenant-id', schemaName: 'tenant_abc123' };
  const entityId = '7b4c9e2a-1f3d-4a5b-8c6d-9e0f1a2b3c4d';
  const actorId = '3f2a1b4c-5d6e-4f70-a8b9-c0d1e2f3a4b5';
  const makeFile = (name: string): BaseFileInterface => ({
    buffer: Buffer.from(`conteudo-${name}`),
    originalName: name,
    mimetype: 'application/pdf',
    size: 10,
    encoding: '7bit',
  });

  it('persists every file in a single repository batch', async () => {
    const repository = mockAttachmentRepository();
    const storage = mockStorageService();
    const tenantContext = new TenantContext();
    storage.putObject.mockImplementation(({ key }) =>
      Promise.resolve(right(key)),
    );
    repository.saveMany.mockImplementation((entities) =>
      Promise.resolve(right(entities)),
    );
    const service = new UploadAttachmentsBatchService(
      repository,
      storage,
      tenantContext,
    );

    const result = await tenantContext.run(context, () =>
      service.execute({
        files: [makeFile('a.pdf'), makeFile('b.pdf')],
        entityType: ATTACHMENT_ENTITY_TYPE.MEDICAO,
        entityId,
        actorId,
      }),
    );

    expect(result.isRight()).toBe(true);
    expect(storage.putObject).toHaveBeenCalledTimes(2);
    expect(repository.saveMany).toHaveBeenCalledTimes(1);
    expect(repository.saveMany.mock.calls[0][0]).toHaveLength(2);
    expect(storage.removeObject).not.toHaveBeenCalled();
  });

  it('compensates every uploaded object when the batch write fails', async () => {
    const repository = mockAttachmentRepository();
    const storage = mockStorageService();
    const tenantContext = new TenantContext();
    storage.putObject.mockImplementation(({ key }) =>
      Promise.resolve(right(key)),
    );
    storage.removeObject.mockResolvedValue(right(unit));
    repository.saveMany.mockResolvedValue(
      left(
        new AttachmentRepositoryException({
          code: ErrorCodeConstants.ATTACHMENT_REPOSITORY_FAILED,
          statusCode: 500,
        }),
      ),
    );
    const service = new UploadAttachmentsBatchService(
      repository,
      storage,
      tenantContext,
    );

    const result = await tenantContext.run(context, () =>
      service.execute({
        files: [makeFile('a.pdf'), makeFile('b.pdf')],
        entityType: ATTACHMENT_ENTITY_TYPE.MEDICAO,
        entityId,
        actorId,
      }),
    );

    expect(result.isLeft()).toBe(true);
    expect(storage.removeObject).toHaveBeenCalledTimes(2);
  });

  it('rejects an empty batch', async () => {
    const service = new UploadAttachmentsBatchService(
      mockAttachmentRepository(),
      mockStorageService(),
      new TenantContext(),
    );

    const result = await service.execute({
      files: [],
      entityType: ATTACHMENT_ENTITY_TYPE.OBRA,
      entityId,
      actorId,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(ErrorCodeConstants.ATTACHMENT_INVALID_FILE);
  });
});
