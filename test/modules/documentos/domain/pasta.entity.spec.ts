import ErrorCodeConstants from '@/core/constants/error_code.constants';
import PastaEntity, { NOME_PASTA_RAIZ } from '@/modules/documentos/domain/entities/pasta.entity';

const OBRA_ID = '11111111-1111-4111-8111-111111111111';
const USUARIO_ID = '22222222-2222-4222-8222-222222222222';

describe('PastaEntity', () => {
  describe('create', () => {
    it('creates a subpasta with trimmed nome', () => {
      const entity = PastaEntity.create({
        obraId: OBRA_ID,
        pastaPaiId: '33333333-3333-4333-8333-333333333333',
        nome: '  Contratos  ',
        criadoPorUsuarioId: USUARIO_ID,
      });
      expect(entity.nome).toBe('Contratos');
      expect(entity.obraId).toBe(OBRA_ID);
      expect(entity.id).toMatch(/^[0-9a-f-]{36}$/i);
    });

    it('rejects blank nome with PASTA_INVALID_NAME', () => {
      expect(() =>
        PastaEntity.create({
          obraId: OBRA_ID,
          pastaPaiId: null,
          nome: '   ',
          criadoPorUsuarioId: null,
        }),
      ).toThrow(expect.objectContaining({ code: ErrorCodeConstants.PASTA_INVALID_NAME }));
    });
  });

  describe('createRoot', () => {
    it('creates the Raiz folder without parent or author', () => {
      const root = PastaEntity.createRoot(OBRA_ID);
      expect(root.nome).toBe(NOME_PASTA_RAIZ);
      expect(root.pastaPaiId).toBeNull();
      expect(root.criadoPorUsuarioId).toBeNull();
    });
  });

  describe('fromData', () => {
    it('rehydrates without validation', () => {
      const entity = PastaEntity.fromData({
        id: 'x',
        obraId: OBRA_ID,
        pastaPaiId: null,
        nome: '',
        criadoPorUsuarioId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(entity.nome).toBe('');
    });
  });
});
