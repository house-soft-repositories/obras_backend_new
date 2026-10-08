import AppException from '@/core/exceptions/app_exception';
import type { Unit } from '@/core/types/unit';
import AsyncResult from '@/core/types/async_result';

export interface StoragePutParam {
  key: string;
  buffer: Buffer;
  mimetype: string;
  size: number;
}

export default interface IStorageService {
  ensureBucket(): AsyncResult<AppException, Unit>;
  ensureTenantPrefix(tenantPrefix: string): AsyncResult<AppException, Unit>;
  putObject(param: StoragePutParam): AsyncResult<AppException, string>;
  getDownloadUrl(
    key: string,
    originalName?: string,
  ): AsyncResult<AppException, string>;
  getUploadUrl(key: string, mimetype: string): AsyncResult<AppException, string>;
  /**
   * Lê o conteúdo integral de um objeto pelo storageKey.
   * Único ponto em que o binário passa pela API (ex.: anexo fotográfico
   * do dossiê); nos demais fluxos o arquivo vai do bucket ao cliente
   * por URL pré-assinada via getDownloadUrl.
   */
  getObject(key: string): AsyncResult<AppException, Buffer>;
  removeObject(key: string): AsyncResult<AppException, Unit>;
  copyObject(
    sourceKey: string,
    destinationKey: string,
  ): AsyncResult<AppException, Unit>;
}
