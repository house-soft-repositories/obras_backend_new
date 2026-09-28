import ErrorCodeConstants from '@/core/constants/error_code.constants';
import TenantContext from '@/core/multitenancy/tenant_context';
import { ATTACHMENT_ENTITY_TYPE } from '@/modules/attachments/domain/enums/attachment_entity_type.enum';
import { right } from '@/core/types/either';
import UploadDiretoService from '@/modules/documentos/application/upload_direto.service';
import PastaEntity from '@/modules/documentos/domain/entities/pasta.entity';
import mockArquivoRepository from '@test/mocks/documentos/adapters/arquivo_repository.mock';
import mockAttachmentRepository from '@test/mocks/attachments/adapters/attachment_repository.mock';
import mockPastaRepository from '@test/mocks/documentos/adapters/pasta_repository.mock';
import mockStorageService from '@test/mocks/storage/adapters/storage_service.mock';

const OBRA_ID = '11111111-1111-4111-8111-111111111111';
const USUARIO_ID = '22222222-2222-4222-8222-222222222222';

const tenantContext = {
  require: () => ({ tenantId: 't1', schemaName: 'tenant_abc' }),
} as unknown as TenantContext;

const file = {
  buffer: Buffer.from('pdf-bytes'),
  originalName: 'contrato.pdf',
  mimetype: 'application/pdf',
  size: 9,
  encoding: '7bit',
};

describe('UploadDiretoService', () => {
  it('uploads buffer, creates mirror and confirmed arquivo', async () => {
    const pastas = mockPastaRepository();
    const arquivos = mockArquivoRepository();
    const attachments = mockAttachmentRepository();
    const storage = mockStorageService();
    pastas.findById.mockResolvedValue(right(PastaEntity.createRoot(OBRA_ID)));
    storage.putObject.mockResolvedValue(right('tenant_abc/documento/key'));
    attachments.save.mockImplementation((e) => Promise.resolve(right(e)));
    arquivos.save.mockImplementation((e) => Promise.resolve(right(e)));

    const result = await new UploadDiretoService(
      pastas,
      arquivos,
      attachments,
      storage,
      tenantContext,
    ).execute({ pastaId: 'pasta-id', files: [file], usuarioId: USUARIO_ID });

    expect(result.isRight()).toBe(true);
    const [salvo] = result.getOrThrow();
    expect(salvo.confirmado).toBe(true);
    expect(salvo.attachmentId).not.toBeNull();
    const mirror = attachments.save.mock.calls[0][0];
    expect(mirror.entityType).toBe(ATTACHMENT_ENTITY_TYPE.DOCUMENTO);
    expect(mirror.entityId).toBe(salvo.id);
  });

  it('rejects empty buffers without touching storage', async () => {
    const pastas = mockPastaRepository();
    const arquivos = mockArquivoRepository();
    const attachments = mockAttachmentRepository();
    const storage = mockStorageService();
    pastas.findById.mockResolvedValue(right(PastaEntity.createRoot(OBRA_ID)));

    const result = await new UploadDiretoService(
      pastas,
      arquivos,
      attachments,
      storage,
      tenantContext,
    ).execute({
      pastaId: 'pasta-id',
      files: [{ ...file, buffer: Buffer.from(''), size: 0 }],
      usuarioId: USUARIO_ID,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(ErrorCodeConstants.ARQUIVO_UPLOAD_FAILED);
    expect(storage.putObject).not.toHaveBeenCalled();
  });
});
