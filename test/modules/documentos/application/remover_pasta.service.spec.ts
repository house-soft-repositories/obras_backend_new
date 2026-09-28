import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { right } from '@/core/types/either';
import { unit } from '@/core/types/unit';
import RemoverPastaService from '@/modules/documentos/application/remover_pasta.service';
import PastaEntity from '@/modules/documentos/domain/entities/pasta.entity';
import mockArquivoRepository from '@test/mocks/documentos/adapters/arquivo_repository.mock';
import mockPastaRepository from '@test/mocks/documentos/adapters/pasta_repository.mock';

const OBRA_ID = '11111111-1111-4111-8111-111111111111';
const USUARIO_ID = '22222222-2222-4222-8222-222222222222';

const root = () => PastaEntity.createRoot(OBRA_ID);

const child = (pastaPaiId: string | null, nome: string) =>
  PastaEntity.create({
    obraId: OBRA_ID,
    pastaPaiId,
    nome,
    criadoPorUsuarioId: USUARIO_ID,
  });

describe('RemoverPastaService', () => {
  describe('happy path', () => {
    it('removes empty subfolders and the selected folder recursively', async () => {
      const pastas = mockPastaRepository();
      const arquivos = mockArquivoRepository();
      const parent = child(root().id, 'Contratos');
      const nested = child(parent.id, 'Assinados');

      pastas.findById.mockResolvedValue(right(parent));
      pastas.findChildren
        .mockResolvedValueOnce(right([nested]))
        .mockResolvedValueOnce(right([]))
        .mockResolvedValueOnce(right([nested]))
        .mockResolvedValueOnce(right([]));
      arquivos.countByPastaId.mockResolvedValue(right(0));
      pastas.deleteById.mockResolvedValue(right(unit));

      const result = await new RemoverPastaService(pastas, arquivos).execute({
        pastaId: parent.id,
      });

      expect(result.isRight()).toBe(true);
      expect(pastas.deleteById).toHaveBeenNthCalledWith(1, nested.id);
      expect(pastas.deleteById).toHaveBeenNthCalledWith(2, parent.id);
      expect(arquivos.findByPastaId).not.toHaveBeenCalled();
    });
  });

  describe('error cases', () => {
    it('does not remove root folder', async () => {
      const pastas = mockPastaRepository();
      const arquivos = mockArquivoRepository();
      const pastaRaiz = root();
      pastas.findById.mockResolvedValue(right(pastaRaiz));

      const result = await new RemoverPastaService(pastas, arquivos).execute({
        pastaId: pastaRaiz.id,
      });

      expect(result.isLeft()).toBe(true);
      if (result.isRight()) throw new Error('expected failure');
      expect(result.value.code).toBe(ErrorCodeConstants.PASTA_DELETE_FORBIDDEN);
      expect(pastas.deleteById).not.toHaveBeenCalled();
    });

    it('does not remove folder with direct files', async () => {
      const pastas = mockPastaRepository();
      const arquivos = mockArquivoRepository();
      const parent = child(root().id, 'Contratos');
      pastas.findById.mockResolvedValue(right(parent));
      arquivos.countByPastaId.mockResolvedValue(right(1));

      const result = await new RemoverPastaService(pastas, arquivos).execute({
        pastaId: parent.id,
      });

      expect(result.isLeft()).toBe(true);
      if (result.isRight()) throw new Error('expected failure');
      expect(result.value.code).toBe(ErrorCodeConstants.PASTA_DELETE_FORBIDDEN);
      expect(pastas.deleteById).not.toHaveBeenCalled();
    });

    it('does not remove folder with files in nested subfolders', async () => {
      const pastas = mockPastaRepository();
      const arquivos = mockArquivoRepository();
      const parent = child(root().id, 'Contratos');
      const nested = child(parent.id, 'Assinados');
      pastas.findById.mockResolvedValue(right(parent));
      arquivos.countByPastaId
        .mockResolvedValueOnce(right(0))
        .mockResolvedValueOnce(right(1));
      pastas.findChildren.mockResolvedValueOnce(right([nested]));

      const result = await new RemoverPastaService(pastas, arquivos).execute({
        pastaId: parent.id,
      });

      expect(result.isLeft()).toBe(true);
      if (result.isRight()) throw new Error('expected failure');
      expect(result.value.code).toBe(ErrorCodeConstants.PASTA_DELETE_FORBIDDEN);
      expect(pastas.deleteById).not.toHaveBeenCalled();
    });

    it('returns PASTA_NOT_FOUND for unknown folder', async () => {
      const pastas = mockPastaRepository();
      const arquivos = mockArquivoRepository();
      pastas.findById.mockResolvedValue(right(null));

      const result = await new RemoverPastaService(pastas, arquivos).execute({
        pastaId: 'missing',
      });

      expect(result.isLeft()).toBe(true);
      if (result.isRight()) throw new Error('expected failure');
      expect(result.value.code).toBe(ErrorCodeConstants.PASTA_NOT_FOUND);
    });
  });
});
