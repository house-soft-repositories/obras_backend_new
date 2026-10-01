import { randomUUID } from 'node:crypto';
import { sanitizeFileName } from '@/modules/storage/infra/storage/storage_key';

/**
 * Monta a `storage_key` do anexo de obra privada (RN-PRV-17). O segmento fixo
 * `privadas` separa os objetos deste contexto dos do DocumentosContext dentro
 * do mesmo bucket, o que evita colisao de prefixo e facilita diagnostico.
 */
export function buildObraPrivadaArquivoStorageKey(
  tenantPrefix: string,
  obraPrivadaId: string,
  originalName: string,
): string {
  return `${tenantPrefix}/privadas/${obraPrivadaId}/${randomUUID()}/${sanitizeFileName(originalName)}`;
}
