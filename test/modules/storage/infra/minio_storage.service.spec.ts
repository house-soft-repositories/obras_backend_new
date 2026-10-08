import { Readable } from 'node:stream';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import MinioStorageService from '@/modules/storage/infra/storage/minio_storage.service';

function service(): MinioStorageService {
  return new MinioStorageService({
    endpoint: 'http://minio:9000',
    region: 'auto',
    bucket: 'obras-dev',
    accessKey: 'minioadmin',
    secretKey: 'minioadmin',
    forcePathStyle: true,
    presignExpiresSeconds: 900,
  });
}

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

  describe('getObject', () => {
    it('concatena os chunks do stream em um Buffer', async () => {
      const svc = service();
      (svc as unknown as { client: unknown }).client = {
        getObject: jest.fn(() =>
          Promise.resolve(Readable.from([Buffer.from('ola '), 'mundo'])),
        ),
      };

      const result = await svc.getObject('tenant/foto.jpg');

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(Buffer.isBuffer(result.value)).toBe(true);
        expect(result.value.toString()).toBe('ola mundo');
      }
    });

    it('retorna STORAGE_GET_FAILED quando o bucket falha', async () => {
      const svc = service();
      (svc as unknown as { client: unknown }).client = {
        getObject: jest.fn(() => Promise.reject(new Error('NoSuchKey'))),
      };

      const result = await svc.getObject('tenant/inexistente.jpg');

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value.code).toBe(ErrorCodeConstants.STORAGE_GET_FAILED);
        expect(result.value.statusCode).toBe(500);
      }
    });
  });
});
