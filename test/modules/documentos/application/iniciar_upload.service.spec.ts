import ErrorCodeConstants from '@/core/constants/error_code.constants';
import TenantContext from '@/core/multitenancy/tenant_context';
import { right } from '@/core/types/either';
import { ATTACHMENT_ENTITY_TYPE } from '@/modules/attachments/domain/enums/attachment_entity_type.enum';
import IniciarUploadService from '@/modules/documentos/application/iniciar_upload.service';
import PastaEntity from '@/modules/documentos/domain/entities/pasta.entity';
import mockAttachmentRepository from '@test/mocks/attachments/adapters/attachment_repository.mock';
import mockArquivoRepository from '@test/mocks/documentos/adapters/arquivo_repository.mock';
import mockPastaRepository from '@test/mocks/documentos/adapters/pasta_repository.mock';
import mockStorageService from '@test/mocks/storage/adapters/storage_service.mock';

const OBRA_ID = '11111111-1111-4111-8111-111111111111';
const USUARIO_ID = '22222222-2222-4222-8222-222222222222';

const tenantContext = {
  require: () => ({ tenantId: 't1', schemaName: 'tenant_abc' }),
} as unknown as TenantContext;

const item = {
  nome: 'Contrato assinado',
  nomeOriginal: 'contrato.pdf',
  mimeType: 'application/pdf',
};

describe('IniciarUploadService', () => {
  describe('happy path', () => {
    it('creates metadata and returns a presigned upload url', async () => {
      const pastas = mockPastaRepository();
      const arquivos = mockArquivoRepository();
      const attachments = mockAttachmentRepository();
      const storage = mockStorageService();
      const pasta = PastaEntity.createRoot(OBRA_ID);
      pastas.findById.mockResolvedValue(right(pasta));
      arquivos.save.mockImplementation((e) => Promise.resolve(right(e)));
      attachments.save.mockImplementation((e) => Promise.resolve(right(e)));
      storage.getUploadUrl.mockResolvedValue(right('http://up/obj'));

      const result = await new IniciarUploadService(
        pastas,
        arquivos,
        attachments,
        storage,
        tenantContext,
      ).execute({ pastaId: pasta.id, arquivos: [item], usuarioId: USUARIO_ID });

      expect(result.isRight()).toBe(true);
      const [iniciado] = result.getOrThrow();
      expect(iniciado.urlUpload).toBe('http://up/obj');
      expect(iniciado.storageKey).toContain('documento');
      expect(storage.getUploadUrl).toHaveBeenCalledTimes(1);
      expect(attachments.save).toHaveBeenCalledTimes(1);
      const attachment = attachments.save.mock.calls[0][0];
      expect(attachment.fileUrl).toBe(iniciado.storageKey);
      expect(attachment.originalName).toBe(item.nomeOriginal);
      expect(attachment.entityType).toBe(ATTACHMENT_ENTITY_TYPE.DOCUMENTO);
      const saved = arquivos.save.mock.calls[1][0];
      expect(saved.tamanhoBytes).toBeNull();
      expect(saved.attachmentId).toBe(attachment.id);
    });
  });

  describe('error cases', () => {
    it('returns PASTA_NOT_FOUND for unknown pasta', async () => {
      const pastas = mockPastaRepository();
      const arquivos = mockArquivoRepository();
      const attachments = mockAttachmentRepository();
      const storage = mockStorageService();
      pastas.findById.mockResolvedValue(right(null));

      const result = await new IniciarUploadService(
        pastas,
        arquivos,
        attachments,
        storage,
        tenantContext,
      ).execute({ pastaId: 'missing', arquivos: [item], usuarioId: USUARIO_ID });

      expect(result.isLeft()).toBe(true);
      if (result.isRight()) throw new Error('expected failure');
      expect(result.value.code).toBe(ErrorCodeConstants.PASTA_NOT_FOUND);
      expect(arquivos.save).not.toHaveBeenCalled();
    });

    it('rejects an empty batch', async () => {
      const pastas = mockPastaRepository();
      const arquivos = mockArquivoRepository();
      const attachments = mockAttachmentRepository();
      const storage = mockStorageService();

      const result = await new IniciarUploadService(
        pastas,
        arquivos,
        attachments,
        storage,
        tenantContext,
      ).execute({ pastaId: 'x', arquivos: [], usuarioId: USUARIO_ID });

      expect(result.isLeft()).toBe(true);
      expect(pastas.findById).not.toHaveBeenCalled();
    });
  });
});
