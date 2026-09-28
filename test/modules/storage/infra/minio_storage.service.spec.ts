import MinioStorageService from '@/modules/storage/infra/storage/minio_storage.service';

describe('MinioStorageService', () => {
  it('signs upload urls with the public endpoint when configured', async () => {
    const service = new MinioStorageService({
      endpoint: 'http://minio:9000',
      publicEndpoint: 'http://localhost:9000',
      region: 'auto',
      bucket: 'obras-dev',
      accessKey: 'minioadmin',
      secretKey: 'minioadmin',
      forcePathStyle: true,
      presignExpiresSeconds: 900,
    });

    const result = await service.getUploadUrl(
      'tenant_abc/documento/obra/arquivo/contrato.pdf',
      'application/pdf',
    );

    expect(result.isRight()).toBe(true);
    const url = new URL(result.getOrThrow());
    expect(url.origin).toBe('http://localhost:9000');
    expect(url.searchParams.get('X-Amz-SignedHeaders')).toBe('host');
  });

  it('keeps using the internal endpoint when no public endpoint is configured', async () => {
    const service = new MinioStorageService({
      endpoint: 'http://minio:9000',
      region: 'auto',
      bucket: 'obras-dev',
      accessKey: 'minioadmin',
      secretKey: 'minioadmin',
      forcePathStyle: true,
      presignExpiresSeconds: 900,
    });

    const result = await service.getUploadUrl(
      'tenant_abc/documento/obra/arquivo/contrato.pdf',
      'application/pdf',
    );

    expect(result.isRight()).toBe(true);
    expect(new URL(result.getOrThrow()).origin).toBe('http://minio:9000');
  });
});
