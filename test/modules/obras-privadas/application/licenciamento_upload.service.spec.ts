import ErrorCodeConstants from '@/core/constants/error_code.constants';
import type TenantContext from '@/core/multitenancy/tenant_context';
import { left, right } from '@/core/types/either';
import type IObraPrivadaRepository from '@/modules/obras-privadas/adapters/obra_privada_repository.interface';
import CreateAlvaraService from '@/modules/obras-privadas/application/create_alvara.service';
import CreateHabiteSeService from '@/modules/obras-privadas/application/create_habite_se.service';
import {
  ResultadoHabiteSe,
  TipoAlvara,
  VinculoArquivoPrivado,
} from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';
import ObraPrivadaServiceException from '@/modules/obras-privadas/exceptions/obra_privada_service.exception';
import type IStorageService from '@/modules/storage/adapters/storage_service.interface';
import type { DataSource, EntityManager } from 'typeorm';

const makeObraRepo = (): jest.Mocked<IObraPrivadaRepository> =>
  ({ findById: jest.fn() }) as unknown as jest.Mocked<IObraPrivadaRepository>;

const makeStorage = (): jest.Mocked<IStorageService> => ({
    ensureBucket: jest.fn(),
    ensureTenantPrefix: jest.fn(),
    putObject: jest.fn(),
    getDownloadUrl: jest.fn(),
    getUploadUrl: jest.fn(),
    removeObject: jest.fn(),
    copyObject: jest.fn(),
});

const makeDataSource = () => {
  const save = jest.fn(async (model: unknown) => model);
  const manager = {
    getRepository: jest.fn(() => ({ save })),
  } as unknown as jest.Mocked<Pick<EntityManager, 'getRepository'>> & {
    save: jest.Mock;
  };
  const queryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    query: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    isTransactionActive: false,
    manager: manager as unknown as EntityManager,
  };
  const dataSource = {
    createQueryRunner: jest.fn(() => queryRunner),
  } as unknown as jest.Mocked<Pick<DataSource, 'createQueryRunner'>>;
  return {
    dataSource: dataSource as unknown as DataSource,
    manager,
    queryRunner,
    save,
  };
};

const makeTenantContext = () =>
  ({
    require: () => ({
      schemaName: 'tenant_abc',
      tenantId: 'tenant-id',
    }),
  }) as unknown as TenantContext;

const obraStub = {
  toObject: () => ({ tenantId: 'tenant-id', deletedAt: null }),
};

describe('Licenciamento upload integrado', () => {
  it('creates alvara and prepares linked private file upload atomically', async () => {
    const obras = makeObraRepo();
    const storage = makeStorage();
    const { dataSource, queryRunner, save } = makeDataSource();
    obras.findById.mockResolvedValue(right(obraStub as any));
    storage.getUploadUrl.mockResolvedValue(right('https://storage/upload'));

    const service = new CreateAlvaraService(
      obras,
      dataSource,
      storage,
      makeTenantContext(),
    );

    const result = await service.execute({
      tenantId: 'tenant-id',
      obraPrivadaId: 'obra-id',
      ano: 2026,
      tipo: TipoAlvara.CONSTRUCAO,
      usuarioId: 'user-id',
      arquivo: { nomeOriginal: 'alvara.pdf', mimeType: 'application/pdf' },
    });

    expect(result.isRight()).toBe(true);
    const value = result.getOrThrow();
    expect(value.arquivo?.urlUpload).toBe('https://storage/upload');
    expect(value.arquivo?.arquivoId).toBeTruthy();
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    // alvara + arquivo salvos via TypeORM, sem SQL cru
    expect(save).toHaveBeenCalledTimes(2);
    expect(save.mock.calls[1][0]).toEqual(
      expect.objectContaining({
        vinculo: VinculoArquivoPrivado.ALVARA,
        vinculoId: value.alvara.id,
        nomeOriginal: 'alvara.pdf',
        mimeType: 'application/pdf',
        enviadoPorUsuarioId: 'user-id',
      }),
    );
  });

  it('creates habite-se and prepares linked private file upload atomically', async () => {
    const obras = makeObraRepo();
    const storage = makeStorage();
    const { dataSource, save } = makeDataSource();
    obras.findById.mockResolvedValue(right(obraStub as any));
    storage.getUploadUrl.mockResolvedValue(right('https://storage/habite'));

    const service = new CreateHabiteSeService(
      obras,
      dataSource,
      storage,
      makeTenantContext(),
    );

    const result = await service.execute({
      tenantId: 'tenant-id',
      obraPrivadaId: 'obra-id',
      numero: 'HAB-1',
      resultado: ResultadoHabiteSe.APROVADO,
      usuarioId: 'user-id',
      arquivo: { nomeOriginal: 'habite.pdf', mimeType: 'application/pdf' },
    });

    expect(result.isRight()).toBe(true);
    const value = result.getOrThrow();
    expect(value.arquivo?.urlUpload).toBe('https://storage/habite');
    expect(save).toHaveBeenCalledTimes(2);
    expect(save.mock.calls[1][0]).toEqual(
      expect.objectContaining({
        vinculo: VinculoArquivoPrivado.HABITE_SE,
        vinculoId: value.habiteSe.id,
        nomeOriginal: 'habite.pdf',
        mimeType: 'application/pdf',
        enviadoPorUsuarioId: 'user-id',
      }),
    );
  });

  it('returns failure and aborts transaction when presign fails', async () => {
    const obras = makeObraRepo();
    const storage = makeStorage();
    const { dataSource } = makeDataSource();
    obras.findById.mockResolvedValue(right(obraStub as any));
    storage.getUploadUrl.mockResolvedValue(
      left(
        new ObraPrivadaServiceException({
          code: ErrorCodeConstants.OBRA_PRIVADA_ARQUIVO_INVALID_INPUT,
          statusCode: 400,
        }),
      ),
    );

    const service = new CreateAlvaraService(
      obras,
      dataSource,
      storage,
      makeTenantContext(),
    );

    const result = await service.execute({
      tenantId: 'tenant-id',
      obraPrivadaId: 'obra-id',
      ano: 2026,
      tipo: TipoAlvara.CONSTRUCAO,
      usuarioId: 'user-id',
      arquivo: { nomeOriginal: 'alvara.pdf' },
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(
      ErrorCodeConstants.OBRA_PRIVADA_ARQUIVO_INVALID_INPUT,
    );
  });
});
