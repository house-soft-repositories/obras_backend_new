import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import { right } from '@/core/types/either';
import ListarConteudoService from '@/modules/documentos/application/listar_conteudo.service';
import PastaEntity from '@/modules/documentos/domain/entities/pasta.entity';
import mockArquivoRepository from '@test/mocks/documentos/adapters/arquivo_repository.mock';
import mockPastaRepository from '@test/mocks/documentos/adapters/pasta_repository.mock';

const OBRA_ID = '11111111-1111-4111-8111-111111111111';
const USUARIO_ID = '22222222-2222-4222-8222-222222222222';

describe('ListarConteudoService', () => {
  it('returns pasta, breadcrumb trail, subpastas and paged arquivos', async () => {
    const pastas = mockPastaRepository();
    const arquivos = mockArquivoRepository();
    const raiz = PastaEntity.createRoot(OBRA_ID);
    const atual = PastaEntity.create({
      obraId: OBRA_ID,
      pastaPaiId: raiz.id,
      nome: 'Contratos',
      criadoPorUsuarioId: USUARIO_ID,
    });
    pastas.findById.mockImplementation((id: string) =>
      Promise.resolve(right(id === atual.id ? atual : raiz)),
    );
    pastas.findChildren.mockResolvedValue(right([]));
    arquivos.countByPastaId.mockResolvedValue(right(0));
    arquivos.findByPastaId.mockResolvedValue(right([]));

    const result = await new ListarConteudoService(pastas, arquivos).execute({
      pastaId: atual.id,
      pageOptions: new PageOptionsEntity('ASC', 1, 10),
    });

    expect(result.isRight()).toBe(true);
    const conteudo = result.getOrThrow();
    expect(conteudo.trilha.map((t) => t.nome)).toEqual(['Raiz', 'Contratos']);
    expect(conteudo.arquivos.pageData).toEqual([]);
    expect(conteudo.arquivos.pageMeta.itemCount).toBe(0);
    expect(conteudo.arquivos.pageMeta.page).toBe(1);
  });
});
