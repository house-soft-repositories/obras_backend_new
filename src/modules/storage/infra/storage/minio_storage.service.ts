import { Client as MinioClient } from 'minio';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import { unit, type Unit } from '@/core/types/unit';
import IStorageService, {
  StoragePutParam,
} from '@/modules/storage/adapters/storage_service.interface';
import StorageException from '@/modules/storage/exceptions/storage.exception';
import { buildTenantPrefixObjectKey } from '@/modules/storage/infra/storage/storage_key';
export interface StorageConfig {
  endpoint: string;
  region: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
  forcePathStyle: boolean;
  presignExpiresSeconds: number;
}

export default class MinioStorageService implements IStorageService {
  private readonly client: MinioClient;

  constructor(private readonly config: StorageConfig) {
    const url = new URL(config.endpoint);
    const useSSL = url.protocol === 'https:';
    this.client = new MinioClient({
      endPoint: url.hostname,
      port: url.port ? Number(url.port) : useSSL ? 443 : 80,
      useSSL,
      accessKey: config.accessKey,
      secretKey: config.secretKey,
      region: config.region,
      pathStyle: config.forcePathStyle,
    });
  }

  async ensureBucket(): AsyncResult<AppException, Unit> {
    try {
      const exists = await this.client.bucketExists(this.config.bucket);
      if (!exists)
        await this.client.makeBucket(this.config.bucket, this.config.region);
      return right(unit);
    } catch (error) {
      return left(
        new StorageException({
          code: ErrorCodeConstants.STORAGE_BUCKET_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }

  async ensureTenantPrefix(
    tenantPrefix: string,
  ): AsyncResult<AppException, Unit> {
    try {
      const ensured = await this.ensureBucket();
      if (ensured.isLeft()) return left(ensured.value);
      await this.client.putObject(
        this.config.bucket,
        buildTenantPrefixObjectKey(tenantPrefix),
        Buffer.from(''),
        0,
        { 'Content-Type': 'text/plain' },
      );
      return right(unit);
    } catch (error) {
      return left(
        new StorageException({
          code: ErrorCodeConstants.STORAGE_PROVISION_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }

  async putObject(param: StoragePutParam): AsyncResult<AppException, string> {
    try {
      const ensured = await this.ensureBucket();
      if (ensured.isLeft()) return left(ensured.value);
      await this.client.putObject(
        this.config.bucket,
        param.key,
        param.buffer,
        param.size,
        { 'Content-Type': param.mimetype },
      );
      return right(param.key);
    } catch (error) {
      return left(
        new StorageException({
          code: ErrorCodeConstants.STORAGE_PUT_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }

  async getDownloadUrl(
    key: string,
    originalName?: string,
  ): AsyncResult<AppException, string> {
    try {
      const url = await this.client.presignedGetObject(
        this.config.bucket,
        key,
        this.config.presignExpiresSeconds,
        originalName
          ? {
              'response-content-disposition': `attachment; filename="${originalName.replace(/"/g, '')}"`,
            }
          : {},
      );
      return right(url);
    } catch (error) {
      return left(
        new StorageException({
          code: ErrorCodeConstants.STORAGE_PRESIGN_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }

  async removeObject(key: string): AsyncResult<AppException, Unit> {
    try {
      await this.client.removeObject(this.config.bucket, key);
      return right(unit);
    } catch (error) {
      return left(
        new StorageException({
          code: ErrorCodeConstants.STORAGE_DELETE_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }

  async copyObject(
    sourceKey: string,
    destinationKey: string,
  ): AsyncResult<AppException, Unit> {
    try {
      await this.client.copyObject(
        this.config.bucket,
        destinationKey,
        `/${this.config.bucket}/${sourceKey}`,
      );
      return right(unit);
    } catch (error) {
      return left(
        new StorageException({
          code: ErrorCodeConstants.STORAGE_PUT_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }
}
