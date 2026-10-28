import { left, right } from '@/core/types/either';
import type IAlvaraRepository from '@/modules/obras-privadas/adapters/alvara_repository.interface';
import type IAutoInfracaoRepository from '@/modules/obras-privadas/adapters/auto_infracao_repository.interface';
import type IFiscalizacaoRepository from '@/modules/obras-privadas/adapters/fiscalizacao_repository.interface';
import type IHabiteSeRepository from '@/modules/obras-privadas/adapters/habite_se_repository.interface';
import type IObraPrivadaArquivoRepository from '@/modules/obras-privadas/adapters/obra_privada_arquivo_repository.interface';
import type IObraPrivadaObservacaoRepository from '@/modules/obras-privadas/adapters/obra_privada_observacao_repository.interface';
import ListObraPrivadaTimelineService from '@/modules/obras-privadas/application/list_obra_privada_timeline.service';

const mockAlvaraRepository = (): jest.Mocked<IAlvaraRepository> =>
  ({
    findByObraPrivadaId: jest.fn().mockResolvedValue(right([])),
  }) as unknown as jest.Mocked<IAlvaraRepository>;

const mockFiscalizacaoRepository = (): jest.Mocked<IFiscalizacaoRepository> =>
  ({
    findByObraPrivadaId: jest.fn().mockResolvedValue(right([])),
  }) as unknown as jest.Mocked<IFiscalizacaoRepository>;

const mockAutoInfracaoRepository = (): jest.Mocked<IAutoInfracaoRepository> =>
  ({
    findByObraPrivadaId: jest.fn().mockResolvedValue(right([])),
  }) as unknown as jest.Mocked<IAutoInfracaoRepository>;

const mockHabiteSeRepository = (): jest.Mocked<IHabiteSeRepository> =>
  ({
    findByObraPrivadaId: jest.fn().mockResolvedValue(right([])),
  }) as unknown as jest.Mocked<IHabiteSeRepository>;

const mockObservacaoRepository =
  (): jest.Mocked<IObraPrivadaObservacaoRepository> =>
    ({
      findByObraPrivadaId: jest.fn().mockResolvedValue(right([])),
    }) as unknown as jest.Mocked<IObraPrivadaObservacaoRepository>;

const mockArquivoRepository = (): jest.Mocked<IObraPrivadaArquivoRepository> =>
  ({
    list: jest.fn().mockResolvedValue(right([])),
  }) as unknown as jest.Mocked<IObraPrivadaArquivoRepository>;

const makeService = () => {
  const repositories = {
    alvara: mockAlvaraRepository(),
    fiscalizacao: mockFiscalizacaoRepository(),
    autoInfracao: mockAutoInfracaoRepository(),
    habiteSe: mockHabiteSeRepository(),
    observacao: mockObservacaoRepository(),
    arquivo: mockArquivoRepository(),
  };

  return {
    repositories,
    service: new ListObraPrivadaTimelineService(
      repositories.alvara,
      repositories.fiscalizacao,
      repositories.autoInfracao,
      repositories.habiteSe,
      repositories.observacao,
      repositories.arquivo,
    ),
  };
};

describe('ListObraPrivadaTimelineService', () => {
  it('orders Date and string dates from newest to oldest', async () => {
    const { repositories, service } = makeService();
    repositories.fiscalizacao.findByObraPrivadaId.mockResolvedValue(
      right([
        {
          toObject: () => ({
            id: 'date-event',
            dataFiscalizacao: new Date('2026-03-10T00:00:00.000Z'),
            numero: 'FIS-1',
            resultado: 'REGULAR',
            constatacoes: null,
          }),
        },
      ] as never),
    );
    repositories.autoInfracao.findByObraPrivadaId.mockResolvedValue(
      right([
        {
          toObject: () => ({
            id: 'string-event',
            dataEmissao: '2026-03-01',
            numero: 'AI-1',
            situacao: 'ABERTO',
            descricao: null,
          }),
        },
      ] as never),
    );

    const result = await service.execute({ obraPrivadaId: 'obra-id' });

    expect(result.isRight()).toBe(true);
    expect(result.value.map((item) => item.id)).toEqual([
      'date-event',
      'string-event',
    ]);
  });

  it('lists files and includes them as ARQUIVO timeline items', async () => {
    const { repositories, service } = makeService();
    repositories.arquivo.list.mockResolvedValue(
      right([
        {
          toObject: () => ({
            id: 'arquivo-event',
            createdAt: new Date('2026-04-01T00:00:00.000Z'),
            nome: 'projeto.pdf',
            categoria: 'DOCUMENTO',
            descricao: 'Projeto aprovado',
          }),
        },
      ] as never),
    );

    const result = await service.execute({ obraPrivadaId: 'obra-id' });

    expect(repositories.arquivo.list).toHaveBeenCalledWith({
      obraPrivadaId: 'obra-id',
    });
    expect(result.isRight()).toBe(true);
    expect(result.value).toContainEqual({
      id: 'arquivo-event',
      tipo: 'ARQUIVO',
      data: '2026-04-01T00:00:00.000Z',
      titulo: 'Arquivo projeto.pdf',
      situacao: 'DOCUMENTO',
      observacoes: 'Projeto aprovado',
    });
  });

  it('propagates an arquivo repository failure', async () => {
    const { repositories, service } = makeService();
    const failure = new Error('arquivo repository failure');
    repositories.arquivo.list.mockResolvedValue(left(failure as never));

    const result = await service.execute({ obraPrivadaId: 'obra-id' });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBe(failure);
  });
});
