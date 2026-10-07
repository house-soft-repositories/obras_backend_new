import {
  gerarCsvListaObras,
  renderizarListaObras,
} from '@/modules/relatorios/domain/relatorios/exportar_lista_obras';
import { ItemListaObrasRelatorio } from '@/modules/relatorios/domain/relatorios/relatorios_read_models';
import { gerarPdfSimples } from '@/modules/relatorios/infra/reporting/pdf_simples';

function itemBase(
  overrides: Partial<ItemListaObrasRelatorio> = {},
): ItemListaObrasRelatorio {
  return {
    obraId: 'obra-1',
    codigo: 'OB-001',
    nome: 'Escola Modelo',
    statusObra: 'EM_DESENVOLVIMENTO',
    tipo: 'OBRA',
    estagioAtualNome: 'Fundação',
    prazoConclusaoEstagio: '2026-06-30',
    percentualRealizado: 42,
    percentualFinanceiro: 30,
    semaforo: null,
    orgaoId: 'orgao-1',
    orgaoNome: 'Secretaria de Obras',
    localidadeNome: 'Centro/UF',
    responsavelNome: 'Maria',
    tags: ['educacao'],
    acaoConveniada: null,
    prioritaria: false,
    empresaExecutora: 'Construtora X',
    numeroContrato: 'CT-1',
    localizacoes: [],
    dataCriacao: '2024-01-15T10:00:00.000Z',
    ultimaAtualizacao: null,
    ...overrides,
  };
}

describe('exportar lista de obras (CSV)', () => {
  it('gera BOM UTF-8, separador ponto-e-virgula e CRLF', () => {
    const csv = gerarCsvListaObras([itemBase()]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain(';');
    expect(csv).toContain('\r\n');
    expect(csv.endsWith('\r\n')).toBe(true);
    const [cabecalho] = csv.replace(/^\uFEFF/, '').split('\r\n');
    expect(cabecalho?.split(';')).toHaveLength(16);
  });

  it('escapa aspas duplicando-as e envolvendo em aspas', () => {
    const csv = gerarCsvListaObras([
      itemBase({ nome: 'Obra "Especial" de Teste' }),
    ]);
    expect(csv).toContain('"Obra ""Especial"" de Teste"');
  });

  it('neutraliza formula-injection prefixando com apóstrofo', () => {
    const csv = gerarCsvListaObras([
      itemBase({ nome: '=SOMA(A1:A2)' }),
      itemBase({ obraId: 'b', codigo: 'OB-002', nome: '+cmd' }),
      itemBase({ obraId: 'c', codigo: 'OB-003', nome: '-calc' }),
      itemBase({ obraId: 'd', codigo: 'OB-004', nome: '@macro' }),
    ]);
    expect(csv).toContain("'=SOMA(A1:A2)");
    expect(csv).toContain("'+cmd");
    expect(csv).toContain("'-calc");
    expect(csv).toContain("'@macro");
  });

  it('renderizarListaObras CSV retorna arquivo com content-type csv', () => {
    const arquivo = renderizarListaObras('CSV', [itemBase()], 1);
    expect(arquivo.filename).toBe('obras.csv');
    expect(arquivo.contentType).toBe('text/csv; charset=utf-8');
    expect(arquivo.buffer.length).toBeGreaterThan(0);
    expect(arquivo.buffer.toString('utf8').charCodeAt(0)).toBe(0xfeff);
  });
});

describe('exportar lista de obras (PDF)', () => {
  it('gerarPdfSimples produz buffer nao-vazio em formato PDF', () => {
    const buffer = gerarPdfSimples('Lista de Obras', 'Total: 1 obra(s)', [
      { titulo: 'Lista de Obras', linhas: ['OB-001 — Escola Modelo'] },
    ]);
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.toString('latin1').startsWith('%PDF-')).toBe(true);
  });

  it('renderizarListaObras PDF retorna arquivo pdf nao-vazio', () => {
    const arquivo = renderizarListaObras('PDF', [itemBase()], 1);
    expect(arquivo.filename).toBe('obras.pdf');
    expect(arquivo.contentType).toBe('application/pdf');
    expect(arquivo.buffer.length).toBeGreaterThan(0);
    expect(arquivo.buffer.toString('latin1').startsWith('%PDF-')).toBe(true);
  });
});
