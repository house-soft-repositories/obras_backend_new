import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { right } from '@/core/types/either';
import AttachmentEntity from '@/modules/attachments/domain/entities/attachment.entity';
import { ATTACHMENT_ENTITY_TYPE } from '@/modules/attachments/domain/enums/attachment_entity_type.enum';
import MoverArquivoService from '@/modules/documentos/application/mover_arquivo.service';
import ArquivoEntity from '@/modules/documentos/domain/entities/arquivo.entity';
import PastaEntity from '@/modules/documentos/domain/entities/pasta.entity';
import mockAttachmentRepository from '@test/mocks/attachments/adapters/attachment_repository.mock';
import mockArquivoRepository from '@test/mocks/documentos/adapters/arquivo_repository.mock';
import mockPastaRepository from '@test/mocks/documentos/adapters/pasta_repository.mock';
import mockStorageService from '@test/mocks/storage/adapters/storage_service.mock';
import TenantContext from '@/core/multitenancy/tenant_context';

const OBRA_ID = '11111111-1111-4111-8111-111111111111';
const OUTRA_OBRA = '99999999-9999-4999-8999-999999999999';
const PASTA_ID = '33333333-3333-4333-8333-333333333333';
const USUARIO_ID = '22222222-2222-4222-8222-222222222222';

const tenantContext = {
  require: () => ({ tenantId: 't1', schemaName: 'tenant_abc' }),
} as unknown as TenantContext;

const arquivo = () =>
  ArquivoEntity.create({
    obraId: OBRA_ID,
    pastaId: PASTA_ID,
    nome: 'Contrato',
    nomeOriginal: 'contrato.pdf',
    storageKey: 'tenant/obra/key/contrato.pdf',
    attachmentId: '44444444-4444-4444-8444-444444444444',
    enviadoPorUsuarioId: USUARIO_ID,
  });

const attachment = (entity: ArquivoEntity) =>
  AttachmentEntity.fromData({
    id: entity.attachmentId ?? '44444444-4444-4444-8444-444444444444',
    fileUrl: entity.storageKey,
    originalName: entity.nomeOriginal,
    entityType: ATTACHMENT_ENTITY_TYPE.DOCUMENTO,
    entityId: entity.id,
    createdBy: USUARIO_ID,
    updatedBy: USUARIO_ID,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

describe('MoverArquivoService', () => {
  describe('happy path', () => {
    it('moves within the same obra and moves the object in storage', async () => {
      const arquivos = mockArquivoRepository();
      const pastas = mockPastaRepository();
      const attachments = mockAttachmentRepository();
      const storage = mockStorageService();
      const origem = arquivo();
      const destino = PastaEntity.create({
        obraId: OBRA_ID,
        pastaPaiId: null,
        nome: 'Medicoes',
        criadoPorUsuarioId: USUARIO_ID,
      });
      arquivos.findById.mockResolvedValue(right(origem));
      pastas.findById.mockResolvedValue(right(destino));
      arquivos.save.mockImplementation((e) => Promise.resolve(right(e)));
      attachments.findById.mockResolvedValue(right(attachment(origem)));
      attachments.save.mockImplementation((e) => Promise.resolve(right(e)));
      storage.copyObject.mockResolvedValue(right(undefined as never));
      storage.removeObject.mockResolvedValue(right(undefined as never));

      const result = await new MoverArquivoService(
        arquivos,
        pastas,
        attachments,
        storage,
        tenantContext,
      ).execute({
        arquivoId: origem.id,
        pastaDestinoId: destino.id,
        usuarioId: USUARIO_ID,
      });

      expect(result.isRight()).toBe(true);
      expect(result.getOrThrow().pastaId).toBe(destino.id);
      expect(result.getOrThrow().storageKey).not.toBe(origem.storageKey);
      expect(result.getOrThrow().storageKey).toContain(`/${destino.id}/`);
      expect(storage.copyObject).toHaveBeenCalledWith(
        origem.storageKey,
        result.getOrThrow().storageKey,
      );
      expect(storage.removeObject).toHaveBeenCalledWith(origem.storageKey);
      expect(attachments.save.mock.calls[0][0].fileUrl).toBe(
        result.getOrThrow().storageKey,
      );
    });
  });

  describe('error cases', () => {
    it('returns ARQUIVO_MOVE_FORBIDDEN 422 across obras', async () => {
      const arquivos = mockArquivoRepository();
      const pastas = mockPastaRepository();
      const attachments = mockAttachmentRepository();
      const storage = mockStorageService();
      arquivos.findById.mockResolvedValue(right(arquivo()));
      pastas.findById.mockResolvedValue(
        right(
          PastaEntity.create({
            obraId: OUTRA_OBRA,
            pastaPaiId: null,
            nome: 'Raiz',
            criadoPorUsuarioId: null,
          }),
        ),
      );

      const result = await new MoverArquivoService(
        arquivos,
        pastas,
        attachments,
        storage,
        tenantContext,
      ).execute({
        arquivoId: 'a',
        pastaDestinoId: 'b',
        usuarioId: USUARIO_ID,
      });

      expect(result.isLeft()).toBe(true);
      if (result.isRight()) throw new Error('expected failure');
      expect(result.value.code).toBe(ErrorCodeConstants.ARQUIVO_MOVE_FORBIDDEN);
      expect(result.value.statusCode).toBe(422);
      expect(arquivos.save).not.toHaveBeenCalled();
    });

    it('returns ARQUIVO_NOT_FOUND for unknown arquivo', async () => {
      const arquivos = mockArquivoRepository();
      const pastas = mockPastaRepository();
      const attachments = mockAttachmentRepository();
      const storage = mockStorageService();
      arquivos.findById.mockResolvedValue(right(null));

      const result = await new MoverArquivoService(
        arquivos,
        pastas,
        attachments,
        storage,
        tenantContext,
      ).execute({
        arquivoId: 'missing',
        pastaDestinoId: 'b',
        usuarioId: USUARIO_ID,
      });

      expect(result.isLeft()).toBe(true);
      if (result.isRight()) throw new Error('expected failure');
      expect(result.value.code).toBe(ErrorCodeConstants.ARQUIVO_NOT_FOUND);
    });
  });
});
