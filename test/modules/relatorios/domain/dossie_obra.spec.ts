import {
  descreverPrazoExecucao,
  formatarData,
  formatarMoeda,
  mascararCnpj,
  montarSecoesDossieObra,
  rotuloEnum,
  secaoIdentificacao,
  type DadosDossieObra,
} from '@/modules/relatorios/domain/relatorios/dossie_obra';
import type { FluxoFisicoFinanceiroRelatorio } from '@/modules/relatorios/domain/relatorios/relatorios_read_models';

function fluxoBase(): FluxoFisicoFinanceiroRelatorio {
  return {
    obraId: 'obra-1',
    orgaoId: 'orgao-1',
    contratadoInicial: '100000.00',
    aditivadoTotal: '10000.00',
    totalContratado: '110000.00',
    medidoTotal: '50000.00',
    empenhadoTotal: '60000.00',
    liquidadoTotal: '40000.00',
    pagoTotal: '30000.00',
    percentuaisPorIndicador: {},
    percentualFisico: 42,
    percentualFinanceiro: 27.27,
    dataReferencia: '2026-10-01',
  };
}

function dossieBase(): DadosDossieObra {
  return {
    obra: {
      codigo: 'OB-001',
      nome: 'Escola Modelo',
      descricao: 'Construção de escola',
      tipo: 'OBRA',
      status: 'EM_DESENVOLVIMENTO',
      tipoFinanciamento: 'SEM_OGU',
      acaoConveniada: 'NAO',
      prioritaria: true,
      dataInicio: '2024-01-10',
      dataPrazo: '2026-06-30',
      dataPactuada: null,
      orgaoNome: 'Secretaria de Obras',
      localidadeNome: 'Cidade/UF',
      secretario: null,
      programaPpa: null,
      acaoEstrategica: null,
      unidadeMedida: 'un',
      quantidade: '1',
    },
    equipe: [{ nome: 'Ana', tipo: 'RESPONSAVEL' }],
    contrato: {
      numero: 'CT-10',
      objeto: 'Execução',
      empresaRazaoSocial: 'Construtora X LTDA',
      empresaCnpj: '12345678000190',
      dataAssinatura: '2024-02-01',
      dataOs: '2024-02-10',
      fimVigencia: '2026-02-10',
      tipoPrazoExecucao: 'DIAS',
      prazoExecucaoDias: 730,
      prazoExecucaoData: null,
      valorInicial: '100000.00',
    },
    aditivos: [
      {
        numero: 'AD-01',
        tipo: 'VALOR',
        dataAssinatura: '2025-01-15',
        vigenciaAditivada: null,
        prazoExecucaoDias: null,
        valor: '10000.00',
      },
    ],
    paralisacoes: [
      {
        dataParalisacao: '2025-03-01',
        motivo: 'Chuvas',
        dataReinicio: null,
        diasParados: null,
      },
    ],
    estagios: [
      {
        descricao: 'Fundação',
        percentual: 100,
        dataPrazo: '2024-06-30',
        concluido: true,
      },
    ],
    medicoes: [
      { numero: 1, dataMedicao: '2024-07-05', tipo: 'PARCIAL', valor: '50000.00' },
    ],
    fluxo: fluxoBase(),
  };
}

describe('dossie_obra (domínio puro)', () => {
  it('formata data ISO como dd/mm/aaaa', () => {
    expect(formatarData('2026-06-30')).toBe('30/06/2026');
    expect(formatarData(new Date('2026-06-30T00:00:00.000Z'))).toBe(
      '30/06/2026',
    );
    expect(formatarData(null)).toBe('—');
    expect(formatarData(undefined)).toBe('—');
    expect(formatarData(new Date('invalida'))).toBe('—');
  });

  it('rotula enums e mascara CNPJ', () => {
    expect(rotuloEnum('EM_DESENVOLVIMENTO')).toBe('Em desenvolvimento');
    expect(rotuloEnum(null)).toBe('—');
    expect(mascararCnpj('12345678000190')).toBe('12.345.678/0001-90');
    expect(mascararCnpj('curto')).toBe('curto');
  });

  it('descreve prazo de execução por dias ou data', () => {
    expect(
      descreverPrazoExecucao({
        tipoPrazoExecucao: 'DIAS',
        prazoExecucaoDias: 30,
        prazoExecucaoData: null,
      }),
    ).toBe('30 dias');
    expect(
      descreverPrazoExecucao({
        tipoPrazoExecucao: 'DATA',
        prazoExecucaoDias: null,
        prazoExecucaoData: '2026-12-31',
      }),
    ).toBe('até 31/12/2026');
  });

  it('monta identificação com prioridade e sem convênio NAO', () => {
    const secao = secaoIdentificacao(dossieBase().obra);
    expect(secao.titulo).toBe('Identificação');
    expect(secao.linhas).toContain('Status: Em desenvolvimento — OBRA PRIORITÁRIA');
    expect(
      secao.linhas.find((linha) => linha.startsWith('Financiamento:')),
    ).toBe('Financiamento: Sem ogu');
    expect(formatarMoeda('110000.00')).toContain('110.000,00');
  });

  it('monta as 8 seções do dossiê com equipe, contrato, aditivos e paralisações', () => {
    const secoes = montarSecoesDossieObra(dossieBase());
    expect(secoes.map((secao) => secao.titulo)).toEqual([
      'Identificação',
      'Equipe',
      'Contrato',
      'Aditivos',
      'Paralisações',
      'Cronograma',
      'Medições',
      'Execução financeira',
    ]);
    expect(secoes[1].linhas).toEqual(['Ana — Responsavel']);
    expect(secoes[2].linhas[1]).toContain('12.345.678/0001-90');
    expect(secoes[3].linhas[0]).toContain('AD-01');
    expect(secoes[4].linhas[0]).toContain('EM CURSO');
    expect(secoes[5].linhas[0]).toContain('(concluído)');
    expect(secoes[7].linhas[2]).toContain('Total contratado:');
  });

  it('usa textos de fallback quando não há contrato, equipe, aditivos ou paralisações', () => {
    const base = dossieBase();
    const secoes = montarSecoesDossieObra({
      ...base,
      equipe: [],
      contrato: null,
      aditivos: [],
      paralisacoes: [],
      estagios: [],
      medicoes: [],
    });
    expect(secoes[1].linhas).toEqual(['Nenhum responsável atribuído.']);
    expect(secoes[2].linhas).toEqual(['OBRA SEM CONTRATO REGISTRADO.']);
    expect(secoes[3].linhas).toEqual(['Nenhum aditivo registrado.']);
    expect(secoes[4].linhas).toEqual(['Nenhuma paralisação registrada.']);
    expect(secoes[5].linhas).toEqual(['Sem estágios cadastrados.']);
    expect(secoes[6].linhas).toEqual(['Sem medições registradas.']);
  });
});
