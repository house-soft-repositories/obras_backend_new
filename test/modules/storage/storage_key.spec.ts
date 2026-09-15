import {
  buildStorageKey,
  buildTenantPrefixObjectKey,
  sanitizeFileName,
} from '@/modules/storage/infra/storage/storage_key';

describe('storage_key', () => {
  it('namespaces the key by tenant, entity and original name', () => {
    const key = buildStorageKey(
      'tenant_abc123',
      'OBRA',
      '7b4c9e2a-1f3d-4a5b-8c6d-9e0f1a2b3c4d',
      'relatório final.pdf',
    );

    expect(
      key.startsWith(
        'tenant_abc123/obra/7b4c9e2a-1f3d-4a5b-8c6d-9e0f1a2b3c4d/',
      ),
    ).toBe(true);
    expect(key.endsWith('relat_rio_final.pdf')).toBe(true);
  });

  it('generates unique keys for the same file', () => {
    const args = [
      'tenant_abc123',
      'OBRA',
      '7b4c9e2a-1f3d-4a5b-8c6d-9e0f1a2b3c4d',
      'doc.pdf',
    ] as const;

    expect(buildStorageKey(...args)).not.toBe(buildStorageKey(...args));
  });

  it('falls back to a default name when nothing is usable', () => {
    expect(sanitizeFileName('???')).toBe('_');
    expect(buildTenantPrefixObjectKey('tenant_abc123')).toBe(
      'tenant_abc123/.keep',
    );
  });
});
