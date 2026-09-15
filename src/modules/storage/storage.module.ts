import { Module } from '@nestjs/common';
import CoreModule from '@/core/core.module';
import ConfigurationService from '@/core/services/configuration.service';
import IStorageService from '@/modules/storage/adapters/storage_service.interface';
import MinioStorageService from '@/modules/storage/infra/storage/minio_storage.service';
import { STORAGE_SERVICE } from '@/modules/storage/symbols';

@Module({
  imports: [CoreModule],
  providers: [
    {
      provide: STORAGE_SERVICE,
      inject: [ConfigurationService],
      useFactory: (config: ConfigurationService): IStorageService =>
        new MinioStorageService({
          endpoint: config.get('STORAGE_ENDPOINT') ?? 'http://minio:9000',
          region: config.get('STORAGE_REGION') ?? 'auto',
          bucket: config.get('STORAGE_BUCKET') ?? 'obras-dev',
          accessKey: config.get('STORAGE_ACCESS_KEY') ?? 'minioadmin',
          secretKey: config.get('STORAGE_SECRET_KEY') ?? 'minioadmin',
          forcePathStyle: config.get('STORAGE_FORCE_PATH_STYLE') ?? true,
          presignExpiresSeconds:
            config.get('STORAGE_PRESIGN_EXPIRES_SECONDS') ?? 900,
        }),
    },
  ],
  exports: [STORAGE_SERVICE],
})
export default class StorageModule {}
