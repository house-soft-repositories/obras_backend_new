import ExportarObrasPrivadasQueryDto, {
  FormatoRelatorioObrasPrivadasDto,
} from '@/modules/obras-privadas/dtos/exportar_obras_privadas_query.dto';
import { gerarPdfSimples } from '@/modules/obras-privadas/infra/reporting/pdf_simples';
import {
  DadosDossie,
  formatarData,
  gerarCsvLista,
  montarSecoesDossie,
  montarSecoesFiscalizacao,
  rotuloEnum,
} from '@/modules/obras-privadas/domain/relatorios/relatorio_privadas';
import {
  ResultadoFiscalizacao,
  TipoFiscalizacao,
} from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';

describe('relatorio privadas dominio', () => {
  const item = {
    id: 'obra-1',
    codigo: 'OBP-2026-0001',
    logradouro: 'Rua A',
    numero: '10',
    bairro: 'Centro',
    uf: 'PI',
    latitude: null,
    longitude: null,
    proprietarioNome: 'João Silva',
    proprietarioDocumento: '52998224725',
    situacaoAlvara: 'COM_ALVARA_VIGENTE',
    andamento: 'EM_ANDAMENTO',
    habiteSe: 'NAO_SOLICITADO',
    etapaAtual: 'FUNDACAO',
    ultimaVisitaEm: '2026-02-03',
    diasSemVisita: 8,
    fiscalizada: true,
    autuada: false,
    embargada: false,
  };

  it('generates Excel-compatible CSV with BOM, semicolon and enum labels', () => {
    const csv = gerarCsvLista([item]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain('Codigo;Endereco;Bairro;UF;Proprietario');
    expect(csv).toContain('OBP-2026-0001;Rua A, 10;Centro;PI;João Silva');
    expect(csv).toContain('Com alvara vigente;Em andamento;Nao solicitado');
    expect(csv).toContain('03/02/2026;8;Nao;Nao');
  });

  it('neutralizes CSV formula injection values', () => {
    const csv = gerarCsvLista([
      { ...item, proprietarioNome: '=IMPORTXML("https://example.com")' },
    ]);
    expect(csv).toContain("'=IMPORTXML");
  });

  it('adds the entulho section only for entulho inspections', () => {
    const obra = {
      codigo: 'OBP-2026-0001',
      descricao: 'Casa',
      logradouro: 'Rua A',
      numero: '10',
      bairro: 'Centro',
      uf: 'PI',
      inscricaoImobiliaria: null,
      matriculaRgi: null,
      latitude: null,
      longitude: null,
      situacaoAlvara: 'SEM_ALVARA',
      andamento: 'EM_ANDAMENTO',
      habiteSe: 'NAO_SOLICITADO',
      proprietarioNome: 'João Silva',
      proprietarioDocumento: '52998224725',
    };
    const fiscalizacao = {
      numero: 'FIS-2026-0001',
      tipo: TipoFiscalizacao.ENTULHO,
      dataFiscalizacao: '2026-02-03',
      resultado: ResultadoFiscalizacao.IRREGULAR,
      etapaConstatada: null,
      constatacoes: null,
      providencias: null,
      latitude: null,
      longitude: null,
      entulhoHaIrregularidade: true,
      entulhoVolumeEstimadoM3: '2.5',
      entulhoLocal: 'VIA_PUBLICA',
      entulhoPossuiCacamba: false,
      entulhoPossuiPgrcc: false,
      entulhoDestinacao: null,
    };
    expect(
      montarSecoesFiscalizacao(obra, fiscalizacao, []).map((s) => s.titulo),
    ).toContain('Entulho e residuos');
  });

  it('renders a minimal PDF buffer', () => {
    const pdf = gerarPdfSimples('Teste', 'Subtitulo', [
      { titulo: 'Secao', linhas: ['Linha'] },
    ]);
    expect(pdf.subarray(0, 8).toString('latin1')).toBe('%PDF-1.4');
    expect(pdf.toString('latin1')).toContain('%%EOF');
  });

  it('normalizes enum labels', () => {
    expect(rotuloEnum('EM_ANDAMENTO')).toBe('Em andamento');
    expect(rotuloEnum(null)).toBe('—');
  });
});

describe('ExportarObrasPrivadasQueryDto', () => {
  it('defaults report format to CSV', () => {
    expect(new ExportarObrasPrivadasQueryDto().formato).toBe(
      FormatoRelatorioObrasPrivadasDto.CSV,
    );
  });
});

describe('formatarData com Date hidratado (regressão iso.slice)', () => {
  it('formata string ISO', () => {
    expect(formatarData('2026-06-30')).toBe('30/06/2026');
  });

  it('formata objeto Date (coluna date hidratada)', () => {
    expect(formatarData(new Date('2026-06-30T00:00:00.000Z'))).toBe(
      '30/06/2026',
    );
  });

  it('devolve travessão para nulo, indefinido e Date inválido', () => {
    expect(formatarData(null)).toBe('—');
    expect(formatarData(undefined)).toBe('—');
    expect(formatarData(new Date('invalida'))).toBe('—');
  });

  it('monta seção de alvarás com datas como Date sem quebrar', () => {
    const dossie = {
      obra: {
        codigo: 'OBP-2026-0001',
        descricao: 'Casa',
        logradouro: 'Rua A',
        numero: '10',
        bairro: 'Centro',
        uf: 'PI',
        inscricaoImobiliaria: null,
        matriculaRgi: null,
        latitude: null,
        longitude: null,
        situacaoAlvara: 'COM_ALVARA_VIGENTE',
        andamento: 'EM_ANDAMENTO',
        habiteSe: 'NAO_SOLICITADO',
        proprietarioNome: 'João Silva',
        proprietarioDocumento: '52998224725',
      },
      alvaras: [
        {
          numero: '123',
          ano: 2026,
          tipo: 'CONSTRUCAO',
          motivo: 'ORIGINAL',
          situacao: 'VIGENTE',
          dataEmissao: new Date('2026-01-15T00:00:00.000Z'),
          dataValidade: new Date('2027-01-15T00:00:00.000Z'),
          areaConstruidaAprovadaM2: '120.00',
        },
      ],
      responsaveis: [],
      fiscalizacoes: [],
      autos: [],
      habiteSe: [],
      observacoes: [],
    } as unknown as DadosDossie;

    const secoes = montarSecoesDossie(dossie);
    const alvaras = secoes.find((secao) => secao.titulo === 'Alvaras');
    expect(alvaras?.linhas[0]).toContain('emissao 15/01/2026');
    expect(alvaras?.linhas[0]).toContain('validade 15/01/2027');
  });
});
