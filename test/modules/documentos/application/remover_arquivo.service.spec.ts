import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { left, right } from '@/core/types/either';
import { unit } from '@/core/types/unit';
import RemoverArquivoService from '@/modules/documentos/application/remover_arquivo.service';
import ArquivoEntity from '@/modules/documentos/domain/entities/arquivo.entity';
import StorageException from '@/modules/storage/exceptions/storage.exception';
import mockArquivoRepository from '@test/mocks/documentos/adapters/arquivo_repository.mock';
import mockAttachmentRepository from '@test/mocks/attachments/adapters/attachment_repository.mock';
import mockStorageService from '@test/mocks/storage/adapters/storage_service.mock';

const OBRA_ID = '11111111-1111-4111-8111-111111111111';
const PASTA_ID = '33333333-3333-4333-8333-333333333333';
const USUARIO_ID = '22222222-2222-4222-8222-222222222222';

describe('RemoverArquivoService', () => {
  describe('happy path', () => {
    it('deletes metadata, mirror and storage object', async () => {
      const arquivos = mockArquivoRepository();
      const attachments = mockAttachmentRepository();
      const storage = mockStorageService();
      const entity = ArquivoEntity.create({
        obraId: OBRA_ID,
        pastaId: PASTA_ID,
        nome: 'Contrato',
        nomeOriginal: 'contrato.pdf',
        storageKey: 'tenant/obra/key/contrato.pdf',
        enviadoPorUsuarioId: USUARIO_ID,
      }).vincularAttachment('55555555-5555-4555-8555-555555555555');
      arquivos.findById.mockResolvedValue(right(entity));
      arquivos.deleteById.mockResolvedValue(right(unit));
      attachments.deleteById.mockResolvedValue(right(unit));
      storage.removeObject.mockResolvedValue(right(unit));

      const result = await new RemoverArquivoService(
        arquivos,
        attachments,
        storage,
      ).execute({ arquivoId: entity.id });

      expect(result.isRight()).toBe(true);
      expect(arquivos.deleteById).toHaveBeenCalledWith(entity.id);
      expect(attachments.deleteById).toHaveBeenCalledWith(
        '55555555-5555-4555-8555-555555555555',
      );
      expect(storage.removeObject).toHaveBeenCalledWith(entity.storageKey);
    });
  });

  describe('error cases', () => {
    it('returns ARQUIVO_NOT_FOUND for unknown arquivo', async () => {
      const arquivos = mockArquivoRepository();
      const attachments = mockAttachmentRepository();
      const storage = mockStorageService();
      arquivos.findById.mockResolvedValue(right(null));

      const result = await new RemoverArquivoService(
        arquivos,
        attachments,
        storage,
      ).execute({ arquivoId: 'missing' });

      expect(result.isLeft()).toBe(true);
      if (result.isRight()) throw new Error('expected failure');
      expect(result.value.code).toBe(ErrorCodeConstants.ARQUIVO_NOT_FOUND);
      expect(arquivos.deleteById).not.toHaveBeenCalled();
      expect(storage.removeObject).not.toHaveBeenCalled();
    });

    it('returns storage failure when object removal fails', async () => {
      const arquivos = mockArquivoRepository();
      const attachments = mockAttachmentRepository();
      const storage = mockStorageService();
      const entity = ArquivoEntity.create({
        obraId: OBRA_ID,
        pastaId: PASTA_ID,
        nome: 'Contrato',
        nomeOriginal: 'contrato.pdf',
        storageKey: 'tenant/obra/key/contrato.pdf',
        enviadoPorUsuarioId: USUARIO_ID,
      });
      const failure = new StorageException({
        code: ErrorCodeConstants.STORAGE_DELETE_FAILED,
        statusCode: 500,
      });
      arquivos.findById.mockResolvedValue(right(entity));
      arquivos.deleteById.mockResolvedValue(right(unit));
      storage.removeObject.mockResolvedValue(left(failure));

      const result = await new RemoverArquivoService(
        arquivos,
        attachments,
        storage,
      ).execute({ arquivoId: entity.id });

      expect(result.isLeft()).toBe(true);
      if (result.isRight()) throw new Error('expected failure');
      expect(result.value).toBe(failure);
    });
  });
});
