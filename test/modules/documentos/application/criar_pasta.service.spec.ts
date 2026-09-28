import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { right } from '@/core/types/either';
import CriarPastaService from '@/modules/documentos/application/criar_pasta.service';
import PastaEntity from '@/modules/documentos/domain/entities/pasta.entity';
import mockPastaRepository from '@test/mocks/documentos/adapters/pasta_repository.mock';

const OBRA_ID = '11111111-1111-4111-8111-111111111111';
const USUARIO_ID = '22222222-2222-4222-8222-222222222222';

describe('CriarPastaService', () => {
  describe('happy path', () => {
    it('creates a subpasta deriving obraId from the parent', async () => {
      const repo = mockPastaRepository();
      const pai = PastaEntity.createRoot(OBRA_ID);
      repo.findById.mockResolvedValue(right(pai));
      repo.findSiblingByName.mockResolvedValue(right(null));
      repo.save.mockImplementation((e) => Promise.resolve(right(e)));

      const result = await new CriarPastaService(repo).execute({
        pastaPaiId: pai.id,
        nome: 'Contratos',
        usuarioId: USUARIO_ID,
      });

      expect(result.isRight()).toBe(true);
      expect(result.getOrThrow().obraId).toBe(OBRA_ID);
      expect(result.getOrThrow().pastaPaiId).toBe(pai.id);
    });
  });

  describe('error cases', () => {
    it('returns PASTA_NOT_FOUND when the parent does not exist', async () => {
      const repo = mockPastaRepository();
      repo.findById.mockResolvedValue(right(null));

      const result = await new CriarPastaService(repo).execute({
        pastaPaiId: 'missing',
        nome: 'X',
        usuarioId: USUARIO_ID,
      });

      expect(result.isLeft()).toBe(true);
      if (result.isRight()) throw new Error('expected failure');
      expect(result.value.code).toBe(ErrorCodeConstants.PASTA_NOT_FOUND);
      expect(result.value.statusCode).toBe(404);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('returns PASTA_DUPLICATE_NAME 409 on sibling collision', async () => {
      const repo = mockPastaRepository();
      const pai = PastaEntity.createRoot(OBRA_ID);
      const irma = PastaEntity.create({
        obraId: OBRA_ID,
        pastaPaiId: pai.id,
        nome: 'Contratos',
        criadoPorUsuarioId: USUARIO_ID,
      });
      repo.findById.mockResolvedValue(right(pai));
      repo.findSiblingByName.mockResolvedValue(right(irma));

      const result = await new CriarPastaService(repo).execute({
        pastaPaiId: pai.id,
        nome: 'Contratos',
        usuarioId: USUARIO_ID,
      });

      expect(result.isLeft()).toBe(true);
      if (result.isRight()) throw new Error('expected failure');
      expect(result.value.code).toBe(ErrorCodeConstants.PASTA_DUPLICATE_NAME);
      expect(result.value.statusCode).toBe(409);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('returns domain failure for blank nome without persisting', async () => {
      const repo = mockPastaRepository();
      const pai = PastaEntity.createRoot(OBRA_ID);
      repo.findById.mockResolvedValue(right(pai));
      repo.findSiblingByName.mockResolvedValue(right(null));

      const result = await new CriarPastaService(repo).execute({
        pastaPaiId: pai.id,
        nome: '   ',
        usuarioId: USUARIO_ID,
      });

      expect(result.isLeft()).toBe(true);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });
});
