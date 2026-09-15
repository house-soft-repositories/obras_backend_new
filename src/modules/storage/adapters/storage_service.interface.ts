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
  removeObject(key: string): AsyncResult<AppException, Unit>;
  copyObject(
    sourceKey: string,
    destinationKey: string,
  ): AsyncResult<AppException, Unit>;
}
