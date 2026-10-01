import { right } from '@/core/types/either';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageMetaEntity from '@/core/pagination/domain/entities/page_meta.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import GerarRelatorioListaObrasPrivadasService from '@/modules/obras-privadas/application/gerar_relatorio_lista_obras_privadas.service';
import type IListarObrasUseCase from '@/modules/obras-privadas/domain/usecase/listar_obras.usecase';

describe('GerarRelatorioListaObrasPrivadasService', () => {
  it('forces export pagination and returns CSV attachment metadata', async () => {
    const listarObras = {
      execute: jest.fn().mockResolvedValue(
        right(
          new PageEntity(
            [
              {
                id: 'obra-1',
                codigo: 'OBP-2026-0001',
                logradouro: 'Rua A',
                numero: null,
                bairro: null,
                uf: 'PI',
                latitude: null,
                longitude: null,
                proprietarioNome: 'João',
                proprietarioDocumento: '52998224725',
                situacaoAlvara: 'SEM_ALVARA',
                andamento: 'EM_ANDAMENTO',
                habiteSe: 'NAO_SOLICITADO',
                etapaAtual: null,
                ultimaVisitaEm: null,
                diasSemVisita: null,
                fiscalizada: false,
                autuada: false,
                embargada: false,
              },
            ],
            new PageMetaEntity({
              pageOptions: new PageOptionsEntity('ASC', 1, 1000),
              itemCount: 1,
            }),
          ),
        ),
      ),
    } as unknown as jest.Mocked<IListarObrasUseCase>;

    const result = await new GerarRelatorioListaObrasPrivadasService(
      listarObras,
    ).execute({ formato: 'CSV' });

    expect(result.isRight()).toBe(true);
    expect(listarObras.execute).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, take: 1000, order: 'ASC' }),
    );
    expect(result.getOrThrow()).toMatchObject({
      filename: 'obras-privadas.csv',
      contentType: 'text/csv; charset=utf-8',
    });
  });
});
