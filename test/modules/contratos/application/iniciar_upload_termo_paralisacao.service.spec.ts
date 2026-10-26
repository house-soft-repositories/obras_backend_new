import { left, right } from '@/core/types/either';
import type IAttachmentRepository from '@/modules/attachments/adapters/attachment_repository.interface';
import type IContratoRepository from '@/modules/contratos/adapters/contrato_repository.interface';
import IniciarUploadTermoParalisacaoService from '@/modules/contratos/application/iniciar_upload_termo_paralisacao.service';
import type IStorageService from '@/modules/storage/adapters/storage_service.interface';
import TenantContext from '@/core/multitenancy/tenant_context';

const contratoId = '550e8400-e29b-41d4-a716-446655440000';
const contrato = { id: contratoId } as never;

describe('IniciarUploadTermoParalisacaoService', () => {
  it('creates attachment and returns a presigned upload URL', async () => {
    const contratoRepo = {
      findById: jest.fn().mockResolvedValue(right(contrato)),
    } as unknown as jest.Mocked<IContratoRepository>;
    const attachments = {
      save: jest.fn().mockImplementation(async (entity) => right(entity)),
      deleteById: jest.fn(),
    } as unknown as jest.Mocked<IAttachmentRepository>;
    const storage = {
      getUploadUrl: jest.fn().mockResolvedValue(right('https://upload.test')),
    } as unknown as jest.Mocked<IStorageService>;
    const tenantContext = {
      require: jest.fn().mockReturnValue({ schemaName: 'tenant_schema' }),
    } as unknown as jest.Mocked<TenantContext>;

    const result = await new IniciarUploadTermoParalisacaoService(
      contratoRepo,
      attachments,
      storage,
      tenantContext,
    ).execute({
      contratoId,
      nomeOriginal: 'termo.pdf',
      mimeType: 'application/pdf',
      usuarioId: 'user-1',
    });

    expect(result.isRight()).toBe(true);
    if (result.isLeft()) throw new Error('expected upload data');
    expect(result.value.urlUpload).toBe('https://upload.test');
    expect(attachments.save).toHaveBeenCalledWith(
      expect.objectContaining({
        toObject: expect.any(Function),
      }),
    );
    expect(storage.getUploadUrl).toHaveBeenCalledWith(
      expect.stringContaining(
        `tenant_schema/contrato-paralisacao/${contratoId}/`,
      ),
      'application/pdf',
    );
  });

  it('does not create an upload when the contract does not exist', async () => {
    const contratoRepo = {
      findById: jest.fn().mockResolvedValue(right(null)),
    } as unknown as jest.Mocked<IContratoRepository>;
    const attachments = {
      save: jest.fn(),
    } as unknown as jest.Mocked<IAttachmentRepository>;
    const storage = {} as jest.Mocked<IStorageService>;
    const tenantContext = {} as jest.Mocked<TenantContext>;

    const result = await new IniciarUploadTermoParalisacaoService(
      contratoRepo,
      attachments,
      storage,
      tenantContext,
    ).execute({
      contratoId: 'missing',
      nomeOriginal: 'termo.pdf',
      mimeType: 'application/pdf',
      usuarioId: 'user-1',
    });

    expect(result.isLeft()).toBe(true);
    expect(attachments.save).not.toHaveBeenCalled();
  });
});
