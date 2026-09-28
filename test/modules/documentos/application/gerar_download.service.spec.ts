import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { right } from '@/core/types/either';
import GerarDownloadService from '@/modules/documentos/application/gerar_download.service';
import ArquivoEntity from '@/modules/documentos/domain/entities/arquivo.entity';
import mockArquivoRepository from '@test/mocks/documentos/adapters/arquivo_repository.mock';
import mockStorageService from '@test/mocks/storage/adapters/storage_service.mock';

const OBRA_ID = '11111111-1111-4111-8111-111111111111';
const PASTA_ID = '33333333-3333-4333-8333-333333333333';
const USUARIO_ID = '22222222-2222-4222-8222-222222222222';

const base = {
  obraId: OBRA_ID,
  pastaId: PASTA_ID,
  nome: 'Contrato',
  nomeOriginal: 'contrato.pdf',
  storageKey: 'tenant/obra/key/contrato.pdf',
  enviadoPorUsuarioId: USUARIO_ID,
};

describe('GerarDownloadService', () => {
  it('returns a presigned url for confirmed arquivos', async () => {
    const arquivos = mockArquivoRepository();
    const storage = mockStorageService();
    arquivos.findById.mockResolvedValue(
      right(ArquivoEntity.create(base).confirmar('100', 'application/pdf')),
    );
    storage.getDownloadUrl.mockResolvedValue(right('http://down/obj'));

    const result = await new GerarDownloadService(arquivos, storage).execute({
      arquivoId: 'a',
    });

    expect(result.isRight()).toBe(true);
    expect(result.getOrThrow().url).toBe('http://down/obj');
  });

  it('returns 422 for unconfirmed uploads', async () => {
    const arquivos = mockArquivoRepository();
    const storage = mockStorageService();
    arquivos.findById.mockResolvedValue(right(ArquivoEntity.create(base)));

    const result = await new GerarDownloadService(arquivos, storage).execute({
      arquivoId: 'a',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(ErrorCodeConstants.ARQUIVO_INVALID_INPUT);
    expect(result.value.statusCode).toBe(422);
    expect(storage.getDownloadUrl).not.toHaveBeenCalled();
  });
});
