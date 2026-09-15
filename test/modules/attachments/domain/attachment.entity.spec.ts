import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AttachmentEntity from '@/modules/attachments/domain/entities/attachment.entity';
import { ATTACHMENT_ENTITY_TYPE } from '@/modules/attachments/domain/enums/attachment_entity_type.enum';

describe('AttachmentEntity', () => {
  const entityId = '7b4c9e2a-1f3d-4a5b-8c6d-9e0f1a2b3c4d';
  const actorId = '3f2a1b4c-5d6e-4f70-a8b9-c0d1e2f3a4b5';
  const base = {
    fileUrl: 'tenant_abc/obra/7b4c9e2a-1f3d-4a5b-8c6d-9e0f1a2b3c4d/doc.pdf',
    originalName: 'doc.pdf',
    entityType: ATTACHMENT_ENTITY_TYPE.OBRA,
    entityId,
    createdBy: actorId,
  };

  it('creates an attachment defaulting updatedBy to createdBy', () => {
    const entity = AttachmentEntity.create(base);

    expect(entity.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(entity.updatedBy).toBe(actorId);
    expect(entity.createdAt).toBeInstanceOf(Date);
  });

  it('rejects an empty fileUrl', () => {
    expect(() => AttachmentEntity.create({ ...base, fileUrl: '  ' })).toThrow(
      ErrorCodeConstants.ATTACHMENT_INVALID_FILE,
    );
  });

  it('rejects an empty originalName', () => {
    expect(() =>
      AttachmentEntity.create({ ...base, originalName: '  ' }),
    ).toThrow(ErrorCodeConstants.ATTACHMENT_INVALID_FILE);
  });

  it('rejects an unknown entityType', () => {
    expect(() =>
      AttachmentEntity.create({
        ...base,
        entityType: 'PASTA' as ATTACHMENT_ENTITY_TYPE,
      }),
    ).toThrow(ErrorCodeConstants.ATTACHMENT_INVALID_ENTITY_TYPE);
  });

  it('rejects a non-uuid entityId', () => {
    expect(() =>
      AttachmentEntity.create({ ...base, entityId: 'not-a-uuid' }),
    ).toThrow(ErrorCodeConstants.ATTACHMENT_INVALID_ENTITY);
  });

  it('rejects an empty actor', () => {
    expect(() => AttachmentEntity.create({ ...base, createdBy: '' })).toThrow(
      ErrorCodeConstants.ATTACHMENT_INVALID_ACTOR,
    );
  });

  it('replaces the file tracking the new author', () => {
    const entity = AttachmentEntity.create(base);
    const nextActor = '9a8b7c6d-5e4f-4a3b-8c7d-6e5f4a3b2c1d';

    const replaced = entity.replaceFile(
      'tenant_abc/obra/novo.pdf',
      'novo.pdf',
      nextActor,
    );

    expect(replaced.id).toBe(entity.id);
    expect(replaced.fileUrl).toBe('tenant_abc/obra/novo.pdf');
    expect(replaced.originalName).toBe('novo.pdf');
    expect(replaced.updatedBy).toBe(nextActor);
    expect(replaced.createdBy).toBe(actorId);
  });

  it('reconstitutes from data without validation', () => {
    const now = new Date();
    const entity = AttachmentEntity.fromData({
      id: 'not-a-uuid',
      fileUrl: '',
      originalName: '',
      entityType: ATTACHMENT_ENTITY_TYPE.OUTRO,
      entityId: 'also-not-a-uuid',
      createdBy: '',
      updatedBy: '',
      createdAt: now,
      updatedAt: now,
    });

    expect(entity.id).toBe('not-a-uuid');
  });
});
