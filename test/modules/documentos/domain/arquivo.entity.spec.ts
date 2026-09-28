import ErrorCodeConstants from '@/core/constants/error_code.constants';
import ArquivoEntity from '@/modules/documentos/domain/entities/arquivo.entity';

const OBRA_ID = '11111111-1111-4111-8111-111111111111';
const PASTA_ID = '33333333-3333-4333-8333-333333333333';
const USUARIO_ID = '22222222-2222-4222-8222-222222222222';

const base = {
  obraId: OBRA_ID,
  pastaId: PASTA_ID,
  nome: 'Contrato assinado',
  nomeOriginal: 'contrato.pdf',
  storageKey: 'tenant/obra/key/contrato.pdf',
  enviadoPorUsuarioId: USUARIO_ID,
};

describe('ArquivoEntity', () => {
  describe('create', () => {
    it('creates an unconfirmed arquivo without attachment link', () => {
      const entity = ArquivoEntity.create({ ...base, mimeType: 'application/pdf' });
      expect(entity.confirmado).toBe(false);
      expect(entity.attachmentId).toBeNull();
      expect(entity.tamanhoBytes).toBeNull();
    });

    it('rejects blank nome with ARQUIVO_INVALID_INPUT', () => {
      expect(() => ArquivoEntity.create({ ...base, nome: ' ' })).toThrow(
        expect.objectContaining({ code: ErrorCodeConstants.ARQUIVO_INVALID_INPUT }),
      );
    });
  });

  describe('confirmar', () => {
    it('marks the arquivo as confirmed', () => {
      const entity = ArquivoEntity.create(base).confirmar('2048', 'application/pdf');
      expect(entity.confirmado).toBe(true);
      expect(entity.tamanhoBytes).toBe('2048');
      expect(entity.mimeType).toBe('application/pdf');
    });
  });

  describe('editar/mover/vincularAttachment', () => {
    it('edits nome and descricao keeping the storage key', () => {
      const entity = ArquivoEntity.create(base).editar({
        nome: 'Novo nome',
        descricao: 'desc',
      });
      expect(entity.nome).toBe('Novo nome');
      expect(entity.descricao).toBe('desc');
      expect(entity.storageKey).toBe(base.storageKey);
    });

    it('moves keeping the storage key', () => {
      const destino = '44444444-4444-4444-8444-444444444444';
      const entity = ArquivoEntity.create(base).mover(destino);
      expect(entity.pastaId).toBe(destino);
      expect(entity.storageKey).toBe(base.storageKey);
    });

    it('links the attachment mirror', () => {
      const attachmentId = '55555555-5555-4555-8555-555555555555';
      const entity = ArquivoEntity.create(base).vincularAttachment(attachmentId);
      expect(entity.attachmentId).toBe(attachmentId);
    });
  });
});
