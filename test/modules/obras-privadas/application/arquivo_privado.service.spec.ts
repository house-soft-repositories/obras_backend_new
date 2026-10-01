import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { left, right } from '@/core/types/either';
import { unit } from '@/core/types/unit';
import type IObraPrivadaArquivoRepository from '@/modules/obras-privadas/adapters/obra_privada_arquivo_repository.interface';
import ConfirmarUploadArquivoService from '@/modules/obras-privadas/application/confirmar_upload_arquivo.service';
import EditarArquivoService from '@/modules/obras-privadas/application/editar_arquivo.service';
import ExcluirArquivoService from '@/modules/obras-privadas/application/excluir_arquivo.service';
import ListarArquivosService from '@/modules/obras-privadas/application/listar_arquivos.service';
import ObterArquivoDownloadUrlService from '@/modules/obras-privadas/application/obter_arquivo_download_url.service';
import ObraPrivadaArquivoEntity from '@/modules/obras-privadas/domain/entities/obra_privada_arquivo.entity';
import { VinculoArquivoPrivado } from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';
import type IStorageService from '@/modules/storage/adapters/storage_service.interface';

const makeArquivoRepo = (): jest.Mocked<IObraPrivadaArquivoRepository> => ({
  save: jest.fn(),
  findById: jest.fn(),
  list: jest.fn(),
  delete: jest.fn(),
});

const makeStorage = (): jest.Mocked<IStorageService> => ({
  getUploadUrl: jest.fn(),
  getDownloadUrl: jest.fn(),
  removeObject: jest.fn(),
});

const makeEntity = () =>
  ObraPrivadaArquivoEntity.create({
    tenantId: 't1',
    obraPrivadaId: 'obra-1',
    vinculo: VinculoArquivoPrivado.OBRA,
    nomeOriginal: 'foto.jpg',
    storageKey: 'tenant_abc/privadas/obra-1/uuid/foto.jpg',
    enviadoPorUsuarioId: 'user-1',
  });

describe('ConfirmarUploadArquivoService', () => {
  it('confirms upload fixing size and mime type', async () => {
    const arquivos = makeArquivoRepo();
    const entity = makeEntity();
    arquivos.findById.mockResolvedValue(right(entity));
    arquivos.save.mockImplementation((e) => Promise.resolve(right(e)));
    const svc = new ConfirmarUploadArquivoService(arquivos);
    const result = await svc.execute({
      id: entity.id,
      tamanhoBytes: 1024,
      mimeType: 'image/jpeg',
    });
    expect(result.isRight()).toBe(true);
    expect(result.getOrThrow().toObject().tamanhoBytes).toBe('1024');
  });

  it('returns 404 when arquivo does not exist', async () => {
    const arquivos = makeArquivoRepo();
    arquivos.findById.mockResolvedValue(right(null));
    const svc = new ConfirmarUploadArquivoService(arquivos);
    const result = await svc.execute({ id: 'missing', tamanhoBytes: 10 });
    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(
      ErrorCodeConstants.OBRA_PRIVADA_ARQUIVO_NOT_FOUND,
    );
  });
});

describe('ListarArquivosService', () => {
  it('lists arquivos by obra with filters', async () => {
    const arquivos = makeArquivoRepo();
    const entity = makeEntity();
    arquivos.list.mockResolvedValue(right([entity]));
    const svc = new ListarArquivosService(arquivos);
    const result = await svc.execute({
      obraPrivadaId: 'obra-1',
      vinculo: VinculoArquivoPrivado.OBRA,
    });
    expect(result.isRight()).toBe(true);
    expect(result.getOrThrow()).toHaveLength(1);
    expect(arquivos.list).toHaveBeenCalledWith({
      obraPrivadaId: 'obra-1',
      vinculo: VinculoArquivoPrivado.OBRA,
    });
  });

  it('propagates repository failure', async () => {
    const arquivos = makeArquivoRepo();
    arquivos.list.mockResolvedValue(
      left({
        code: ErrorCodeConstants.OBRA_PRIVADA_ARQUIVO_REPOSITORY_FAILED,
      } as any),
    );
    const svc = new ListarArquivosService(arquivos);
    const result = await svc.execute({ obraPrivadaId: 'obra-1' });
    expect(result.isLeft()).toBe(true);
  });
});

describe('ObterArquivoDownloadUrlService', () => {
  it('returns presigned download url with metadata', async () => {
    const arquivos = makeArquivoRepo();
    const storage = makeStorage();
    const entity = makeEntity();
    arquivos.findById.mockResolvedValue(right(entity));
    storage.getDownloadUrl.mockResolvedValue(right('https://s3/download-url'));
    const svc = new ObterArquivoDownloadUrlService(arquivos, storage);
    const result = await svc.execute({ id: entity.id });
    expect(result.isRight()).toBe(true);
    expect(result.getOrThrow()).toEqual({
      url: 'https://s3/download-url',
      nome: 'foto.jpg',
      mimeType: null,
    });
  });

  it('returns 404 when arquivo does not exist', async () => {
    const arquivos = makeArquivoRepo();
    const storage = makeStorage();
    arquivos.findById.mockResolvedValue(right(null));
    const svc = new ObterArquivoDownloadUrlService(arquivos, storage);
    const result = await svc.execute({ id: 'missing' });
    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(
      ErrorCodeConstants.OBRA_PRIVADA_ARQUIVO_NOT_FOUND,
    );
  });
});

describe('EditarArquivoService', () => {
  it('edits only metadata fields', async () => {
    const arquivos = makeArquivoRepo();
    const entity = makeEntity();
    arquivos.findById.mockResolvedValue(right(entity));
    arquivos.save.mockImplementation((e) => Promise.resolve(right(e)));
    const svc = new EditarArquivoService(arquivos);
    const result = await svc.execute({
      id: entity.id,
      nome: 'Fachada frontal',
      ordem: 2,
    });
    expect(result.isRight()).toBe(true);
    const value = result.getOrThrow().toObject();
    expect(value.nome).toBe('Fachada frontal');
    expect(value.ordem).toBe(2);
    expect(value.storageKey).toBe(entity.toObject().storageKey);
  });
});

describe('ExcluirArquivoService', () => {
  it('deletes metadata and removes bucket object returning unit', async () => {
    const arquivos = makeArquivoRepo();
    const storage = makeStorage();
    const entity = makeEntity();
    arquivos.findById.mockResolvedValue(right(entity));
    arquivos.delete.mockResolvedValue(right(unit));
    storage.removeObject.mockResolvedValue(right(unit));
    const svc = new ExcluirArquivoService(arquivos, storage);
    const result = await svc.execute({ id: entity.id });
    expect(result.isRight()).toBe(true);
    expect(result.getOrThrow()).toBe(unit);
    expect(storage.removeObject).toHaveBeenCalledWith(
      entity.toObject().storageKey,
    );
  });

  it('tolerates bucket removal failure after metadata deletion', async () => {
    const arquivos = makeArquivoRepo();
    const storage = makeStorage();
    const entity = makeEntity();
    arquivos.findById.mockResolvedValue(right(entity));
    arquivos.delete.mockResolvedValue(right(unit));
    storage.removeObject.mockResolvedValue(
      left({ code: ErrorCodeConstants.STORAGE_DELETE_FAILED } as any),
    );
    const svc = new ExcluirArquivoService(arquivos, storage);
    const result = await svc.execute({ id: entity.id });
    expect(result.isRight()).toBe(true);
  });

  it('returns 404 when arquivo does not exist', async () => {
    const arquivos = makeArquivoRepo();
    const storage = makeStorage();
    arquivos.findById.mockResolvedValue(right(null));
    const svc = new ExcluirArquivoService(arquivos, storage);
    const result = await svc.execute({ id: 'missing' });
    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(
      ErrorCodeConstants.OBRA_PRIVADA_ARQUIVO_NOT_FOUND,
    );
    expect(arquivos.delete).not.toHaveBeenCalled();
  });
});
