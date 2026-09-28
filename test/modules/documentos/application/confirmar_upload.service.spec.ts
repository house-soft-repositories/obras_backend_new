import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { ATTACHMENT_ENTITY_TYPE } from '@/modules/attachments/domain/enums/attachment_entity_type.enum';
import { right } from '@/core/types/either';
import ConfirmarUploadService from '@/modules/documentos/application/confirmar_upload.service';
import ArquivoEntity from '@/modules/documentos/domain/entities/arquivo.entity';
import mockArquivoRepository from '@test/mocks/documentos/adapters/arquivo_repository.mock';
import mockAttachmentRepository from '@test/mocks/attachments/adapters/attachment_repository.mock';

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

describe('ConfirmarUploadService', () => {
  describe('happy path', () => {
    it('confirms size and creates the DOCUMENTO attachment mirror', async () => {
      const arquivos = mockArquivoRepository();
      const attachments = mockAttachmentRepository();
      arquivos.findById.mockResolvedValue(right(ArquivoEntity.create(base)));
      attachments.save.mockImplementation((e) => Promise.resolve(right(e)));
      arquivos.save.mockImplementation((e) => Promise.resolve(right(e)));

      const result = await new ConfirmarUploadService(arquivos, attachments).execute({
        arquivoId: 'arquivo-id',
        tamanhoBytes: 2048,
      });

      expect(result.isRight()).toBe(true);
      expect(result.getOrThrow().tamanhoBytes).toBe('2048');
      expect(result.getOrThrow().attachmentId).not.toBeNull();
      const mirror = attachments.save.mock.calls[0][0];
      expect(mirror.entityType).toBe(ATTACHMENT_ENTITY_TYPE.DOCUMENTO);
      expect(mirror.fileUrl).toBe(base.storageKey);
    });
  });

  describe('error cases', () => {
    it('returns ARQUIVO_NOT_FOUND for unknown arquivo', async () => {
      const arquivos = mockArquivoRepository();
      const attachments = mockAttachmentRepository();
      arquivos.findById.mockResolvedValue(right(null));

      const result = await new ConfirmarUploadService(arquivos, attachments).execute({
        arquivoId: 'missing',
        tamanhoBytes: 10,
      });

      expect(result.isLeft()).toBe(true);
      if (result.isRight()) throw new Error('expected failure');
      expect(result.value.code).toBe(ErrorCodeConstants.ARQUIVO_NOT_FOUND);
      expect(attachments.save).not.toHaveBeenCalled();
    });

    it('rejects negative tamanhoBytes', async () => {
      const arquivos = mockArquivoRepository();
      const attachments = mockAttachmentRepository();

      const result = await new ConfirmarUploadService(arquivos, attachments).execute({
        arquivoId: 'x',
        tamanhoBytes: -1,
      });

      expect(result.isLeft()).toBe(true);
      expect(arquivos.findById).not.toHaveBeenCalled();
    });
  });
});
