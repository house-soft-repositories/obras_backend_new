import { randomUUID } from 'node:crypto';

export function sanitizeFileName(originalName: string): string {
  const safe = originalName.replace(/[^\w.-]+/g, '_').slice(0, 120);
  return safe || 'arquivo';
}

export function buildStorageKey(
  tenantPrefix: string,
  entityType: string,
  entityId: string,
  originalName: string,
): string {
  return `${tenantPrefix}/${entityType.toLowerCase()}/${entityId}/${randomUUID()}/${sanitizeFileName(originalName)}`;
}

export function buildTenantPrefixObjectKey(tenantPrefix: string): string {
  return `${tenantPrefix}/.keep`;
}
