import TenantContext from '@/core/multitenancy/tenant_context';
import { ATTACHMENT_ENTITY_TYPE } from '@/modules/attachments/domain/enums/attachment_entity_type.enum';
import { right } from '@/core/types/either';
import { unit } from '@/core/types/unit';
import DuplicarArvoreService from '@/modules/documentos/application/duplicar_arvore.service';
import ArquivoEntity from '@/modules/documentos/domain/entities/arquivo.entity';
import PastaEntity from '@/modules/documentos/domain/entities/pasta.entity';
import mockArquivoRepository from '@test/mocks/documentos/adapters/arquivo_repository.mock';
import mockAttachmentRepository from '@test/mocks/attachments/adapters/attachment_repository.mock';
import mockPastaRepository from '@test/mocks/documentos/adapters/pasta_repository.mock';
import mockStorageService from '@test/mocks/storage/adapters/storage_service.mock';

const ORIGEM = '11111111-1111-4111-8111-111111111111';
const DESTINO = '99999999-9999-4999-8999-999999999999';
const USUARIO_ID = '22222222-2222-4222-8222-222222222222';

const tenantContext = {
  require: () => ({ tenantId: 't1', schemaName: 'tenant_abc' }),
} as unknown as TenantContext;

describe('DuplicarArvoreService', () => {
  it('replicates folders and file copies with new storage keys', async () => {
    const pastas = mockPastaRepository();
    const arquivos = mockArquivoRepository();
    const attachments = mockAttachmentRepository();
    const storage = mockStorageService();

    const raiz = PastaEntity.createRoot(ORIGEM);
    const sub = PastaEntity.create({
      obraId: ORIGEM,
      pastaPaiId: raiz.id,
      nome: 'Contratos',
      criadoPorUsuarioId: USUARIO_ID,
    });
    const arquivo = ArquivoEntity.create({
      obraId: ORIGEM,
      pastaId: sub.id,
      nome: 'Contrato',
      nomeOriginal: 'contrato.pdf',
      storageKey: 'tenant_abc/documento/old',
      enviadoPorUsuarioId: USUARIO_ID,
    }).confirmar('100', 'application/pdf');

    pastas.findByObraId.mockResolvedValue(right([raiz, sub]));
    pastas.save.mockImplementation((e) => Promise.resolve(right(e)));
    pastas.findById.mockImplementation((id: string) => {
      const saved = pastas.save.mock.calls
        .map((c) => c[0])
        .find((p: PastaEntity) => p.id === id);
      return Promise.resolve(right(saved ? PastaEntity.fromData(saved.toObject()) : null));
    });
    arquivos.findByObraId.mockResolvedValue(right([arquivo]));
    storage.copyObject.mockResolvedValue(right(unit));
    attachments.save.mockImplementation((e) => Promise.resolve(right(e)));
    arquivos.save.mockImplementation((e) => Promise.resolve(right(e)));

    const result = await new DuplicarArvoreService(
      pastas,
      arquivos,
      attachments,
      storage,
      tenantContext,
    ).execute({ obraOrigemId: ORIGEM, obraDestinoId: DESTINO });

    expect(result.isRight()).toBe(true);
    expect(pastas.save).toHaveBeenCalledTimes(3);
    expect(storage.copyObject).toHaveBeenCalledTimes(1);
    const [origKey, novaKey] = storage.copyObject.mock.calls[0];
    expect(origKey).toBe('tenant_abc/documento/old');
    expect(novaKey).not.toBe(origKey);
    const mirror = attachments.save.mock.calls[0][0];
    expect(mirror.entityType).toBe(ATTACHMENT_ENTITY_TYPE.DOCUMENTO);
    const copia = arquivos.save.mock.calls[0][0];
    expect(copia.obraId).toBe(DESTINO);
    expect(copia.storageKey).toBe(novaKey);
  });
});
