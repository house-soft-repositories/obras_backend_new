import ErrorCodeConstants from '@/core/constants/error_code.constants';
import type TenantContext from '@/core/multitenancy/tenant_context';
import { left, right } from '@/core/types/either';
import { unit } from '@/core/types/unit';
import type IObraPrivadaArquivoRepository from '@/modules/obras-privadas/adapters/obra_privada_arquivo_repository.interface';
import type IObraPrivadaRepository from '@/modules/obras-privadas/adapters/obra_privada_repository.interface';
import IniciarUploadArquivoService from '@/modules/obras-privadas/application/iniciar_upload_arquivo.service';
import { VinculoArquivoPrivado } from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';
import type ObraPrivadaEntity from '@/modules/obras-privadas/domain/entities/obra_privada.entity';
import type IStorageService from '@/modules/storage/adapters/storage_service.interface';

const makeArquivoRepo = (): jest.Mocked<IObraPrivadaArquivoRepository> => ({
  save: jest.fn(),
  findById: jest.fn(),
  list: jest.fn(),
  delete: jest.fn(),
});

const makeObraRepo = (): jest.Mocked<IObraPrivadaRepository> => ({
  findById: jest.fn(),
});

const makeStorage = (): jest.Mocked<IStorageService> => ({
  getUploadUrl: jest.fn(),
  getDownloadUrl: jest.fn(),
  removeObject: jest.fn(),
});

const makeTC = () =>
  ({ require: () => ({ schemaName: 'tenant_abc' }) }) as unknown as TenantContext;

const obraStub = {
  toObject: () => ({ tenantId: 't1' }),
} as unknown as ObraPrivadaEntity;

const obraExcluidaStub = {
  toObject: () => ({ tenantId: 't1', deletedAt: new Date('2026-01-01') }),
} as unknown as ObraPrivadaEntity;

const baseParam = {
  obraPrivadaId: 'obra-1',
  vinculo: VinculoArquivoPrivado.OBRA,
  usuarioId: 'user-1',
  arquivos: [{ nomeOriginal: 'foto.jpg', mimeType: 'image/jpeg' }],
};

describe('IniciarUploadArquivoService', () => {
  it('creates metadata and returns presigned upload urls', async () => {
    const arquivos = makeArquivoRepo();
    const obras = makeObraRepo();
    const storage = makeStorage();
    obras.findById.mockResolvedValue(right(obraStub));
    arquivos.save.mockImplementation((e) => Promise.resolve(right(e)));
    storage.getUploadUrl.mockResolvedValue(right('https://s3/upload-url'));
    const svc = new IniciarUploadArquivoService(
      arquivos,
      obras,
      storage,
      makeTC(),
    );
    const result = await svc.execute(baseParam);
    expect(result.isRight()).toBe(true);
    const [item] = result.getOrThrow();
    expect(item.urlUpload).toBe('https://s3/upload-url');
    expect(item.arquivoId).toBeTruthy();
    expect(arquivos.save).toHaveBeenCalledTimes(1);
    expect(storage.getUploadUrl).toHaveBeenCalledTimes(1);
  });

  it('returns 404 when obra privada does not exist', async () => {
    const arquivos = makeArquivoRepo();
    const obras = makeObraRepo();
    const storage = makeStorage();
    obras.findById.mockResolvedValue(right(null));
    const svc = new IniciarUploadArquivoService(
      arquivos,
      obras,
      storage,
      makeTC(),
    );
    const result = await svc.execute(baseParam);
    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(ErrorCodeConstants.OBRA_PRIVADA_NOT_FOUND);
    expect(arquivos.save).not.toHaveBeenCalled();
  });

  it('returns 404 when obra privada is soft deleted', async () => {
    const arquivos = makeArquivoRepo();
    const obras = makeObraRepo();
    const storage = makeStorage();
    obras.findById.mockResolvedValue(right(obraExcluidaStub));
    const svc = new IniciarUploadArquivoService(
      arquivos,
      obras,
      storage,
      makeTC(),
    );
    const result = await svc.execute(baseParam);
    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(ErrorCodeConstants.OBRA_PRIVADA_NOT_FOUND);
    expect(arquivos.save).not.toHaveBeenCalled();
    expect(storage.getUploadUrl).not.toHaveBeenCalled();
  });

  it('returns 400 when arquivo batch is empty', async () => {
    const arquivos = makeArquivoRepo();
    const obras = makeObraRepo();
    const storage = makeStorage();
    const svc = new IniciarUploadArquivoService(
      arquivos,
      obras,
      storage,
      makeTC(),
    );
    const result = await svc.execute({ ...baseParam, arquivos: [] });
    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(
      ErrorCodeConstants.OBRA_PRIVADA_ARQUIVO_INVALID_INPUT,
    );
    expect(obras.findById).not.toHaveBeenCalled();
  });

  it('rolls back metadata when presign fails', async () => {
    const arquivos = makeArquivoRepo();
    const obras = makeObraRepo();
    const storage = makeStorage();
    obras.findById.mockResolvedValue(right(obraStub));
    arquivos.save.mockImplementation((e) => Promise.resolve(right(e)));
    arquivos.delete.mockResolvedValue(right(unit));
    storage.getUploadUrl.mockResolvedValue(
      left({ code: ErrorCodeConstants.STORAGE_PRESIGN_FAILED } as any),
    );
    const svc = new IniciarUploadArquivoService(
      arquivos,
      obras,
      storage,
      makeTC(),
    );
    const result = await svc.execute(baseParam);
    expect(result.isLeft()).toBe(true);
    expect(arquivos.delete).toHaveBeenCalledTimes(1);
  });
});
