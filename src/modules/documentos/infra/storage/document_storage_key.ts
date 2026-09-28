import { randomUUID } from 'node:crypto';
import { sanitizeFileName } from '@/modules/storage/infra/storage/storage_key';

/**
 * Monta a `storage_key` de um objeto documental (RN-DOC-07/10).
 * Inclui o prefixo do tenant e a obra (organização e diagnóstico),
 * a pasta atual e um nome de arquivo com UUID para garantir unicidade sem
 * criar uma subpasta extra no console do storage. Ao mover arquivo entre
 * pastas, uma nova chave deve ser criada para refletir a nova posição.
 */
export function buildDocumentStorageKey(
  tenantPrefix: string,
  obraId: string,
  pastaId: string,
  originalName: string,
): string {
  return `${tenantPrefix}/documento/${obraId}/${pastaId}/${randomUUID()}-${sanitizeFileName(originalName)}`;
}
