import { right } from '@/core/types/either';
import EditarArquivoService from '@/modules/documentos/application/editar_arquivo.service';
import AttachmentEntity from '@/modules/attachments/domain/entities/attachment.entity';
import { ATTACHMENT_ENTITY_TYPE } from '@/modules/attachments/domain/enums/attachment_entity_type.enum';
import ArquivoEntity from '@/modules/documentos/domain/entities/arquivo.entity';
import mockArquivoRepository from '@test/mocks/documentos/adapters/arquivo_repository.mock';
import mockAttachmentRepository from '@test/mocks/attachments/adapters/attachment_repository.mock';

const OBRA_ID = '11111111-1111-4111-8111-111111111111';
const PASTA_ID = '33333333-3333-4333-8333-333333333333';
const USUARIO_ID = '22222222-2222-4222-8222-222222222222';
const ATTACHMENT_ID = '55555555-5555-4555-8555-555555555555';

describe('EditarArquivoService', () => {
  it('edits metadata and propagates nome to the mirror', async () => {
    const arquivos = mockArquivoRepository();
    const attachments = mockAttachmentRepository();
    const entity = ArquivoEntity.create({
      obraId: OBRA_ID,
      pastaId: PASTA_ID,
      nome: 'Antigo',
      nomeOriginal: 'contrato.pdf',
      storageKey: 'tenant/obra/key',
      enviadoPorUsuarioId: USUARIO_ID,
    }).vincularAttachment(ATTACHMENT_ID);
    const mirror = AttachmentEntity.create({
      fileUrl: 'tenant/obra/key',
      originalName: 'Antigo',
      entityType: ATTACHMENT_ENTITY_TYPE.DOCUMENTO,
      entityId: entity.id,
      createdBy: USUARIO_ID,
    });
    arquivos.findById.mockResolvedValue(right(entity));
    arquivos.save.mockImplementation((e) => Promise.resolve(right(e)));
    attachments.findById.mockResolvedValue(right(mirror));
    attachments.save.mockImplementation((e) => Promise.resolve(right(e)));

    const result = await new EditarArquivoService(arquivos, attachments).execute({
      arquivoId: entity.id,
      nome: 'Novo',
      usuarioId: USUARIO_ID,
    });

    expect(result.isRight()).toBe(true);
    expect(result.getOrThrow().nome).toBe('Novo');
    expect(attachments.save).toHaveBeenCalledTimes(1);
    expect(attachments.save.mock.calls[0][0].originalName).toBe('Novo');
  });
});
