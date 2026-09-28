import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { left, right } from '@/core/types/either';
import GarantirPastaRaizService from '@/modules/documentos/application/garantir_pasta_raiz.service';
import PastaEntity from '@/modules/documentos/domain/entities/pasta.entity';
import PastaRepositoryException from '@/modules/documentos/exceptions/pasta_repository.exception';
import mockPastaRepository from '@test/mocks/documentos/adapters/pasta_repository.mock';

const OBRA_ID = '11111111-1111-4111-8111-111111111111';

describe('GarantirPastaRaizService', () => {
  describe('happy path', () => {
    it('returns the existing root without creating', async () => {
      const repo = mockPastaRepository();
      const root = PastaEntity.createRoot(OBRA_ID);
      repo.findRootByObraId.mockResolvedValue(right(root));

      const result = await new GarantirPastaRaizService(repo).execute({
        obraId: OBRA_ID,
      });

      expect(result.isRight()).toBe(true);
      expect(result.getOrThrow().id).toBe(root.id);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('creates the root when missing (idempotent entry point)', async () => {
      const repo = mockPastaRepository();
      repo.findRootByObraId.mockResolvedValue(right(null));
      repo.save.mockImplementation((e) => Promise.resolve(right(e)));

      const result = await new GarantirPastaRaizService(repo).execute({
        obraId: OBRA_ID,
      });

      expect(result.isRight()).toBe(true);
      expect(result.getOrThrow().nome).toBe('Raiz');
      expect(result.getOrThrow().pastaPaiId).toBeNull();
      expect(repo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('error cases', () => {
    it('propagates repository failure', async () => {
      const repo = mockPastaRepository();
      repo.findRootByObraId.mockResolvedValue(
        left(
          new PastaRepositoryException({
            code: ErrorCodeConstants.PASTA_REPOSITORY_FAILED,
            statusCode: 500,
          }),
        ),
      );

      const result = await new GarantirPastaRaizService(repo).execute({
        obraId: OBRA_ID,
      });

      expect(result.isLeft()).toBe(true);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });
});
