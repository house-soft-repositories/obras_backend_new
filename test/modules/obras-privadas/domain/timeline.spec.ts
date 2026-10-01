import {
  EtapaObraPrivada,
  ResultadoFiscalizacao,
  SituacaoRegistroAlvara,
  TipoAutoInfracao,
  TipoEventoTimeline,
} from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';
import {
  EntradaTimeline,
  montarEtapas,
  montarTimeline,
  ORDEM_ETAPAS,
} from '@/modules/obras-privadas/domain/timeline';

function vazia(): EntradaTimeline {
  return {
    alvaras: [],
    fiscalizacoes: [],
    autos: [],
    habiteSe: [],
    observacoes: [],
  };
}

describe('timeline derivada (decisao 10)', () => {
  it('ordena do mais recente para o mais antigo', () => {
    const eventos = montarTimeline({
      ...vazia(),
      fiscalizacoes: [
        {
          id: 'f1',
          numero: 'FIS-2026-0009',
          tipo: 'ROTINA',
          resultado: ResultadoFiscalizacao.REGULAR,
          etapaConstatada: EtapaObraPrivada.FUNDACAO,
          dataFiscalizacao: '2026-03-04',
          fiscalUsuarioId: 'u1',
        },
      ],
      autos: [
        {
          id: 'a1',
          numero: 'AI-2026-0071',
          tipo: TipoAutoInfracao.MULTA,
          dataEmissao: '2026-08-02',
          descricao: 'Multa por descumprimento de embargo.',
          lavradoPorUsuarioId: 'u1',
        },
      ],
    });

    expect(eventos.map((e) => e.registroId)).toEqual(['a1', 'f1']);
  });

  it('classifica fiscalizacao irregular com tipo proprio', () => {
    const eventos = montarTimeline({
      ...vazia(),
      fiscalizacoes: [
        {
          id: 'f1',
          numero: 'FIS-2026-0024',
          tipo: 'ENTULHO',
          resultado: ResultadoFiscalizacao.IRREGULAR,
          etapaConstatada: EtapaObraPrivada.COBERTURA,
          dataFiscalizacao: '2026-05-19',
          fiscalUsuarioId: 'u1',
        },
      ],
    });
    expect(eventos[0].tipo).toBe(TipoEventoTimeline.FISCALIZACAO_IRREGULAR);
  });

  it('separa embargo de auto comum', () => {
    const eventos = montarTimeline({
      ...vazia(),
      autos: [
        {
          id: 'a1',
          numero: 'AI-2026-0063',
          tipo: TipoAutoInfracao.EMBARGO,
          dataEmissao: '2026-07-27',
          descricao: 'Area excedente ao projeto aprovado.',
          lavradoPorUsuarioId: 'u1',
        },
        {
          id: 'a2',
          numero: 'AI-2026-0044',
          tipo: TipoAutoInfracao.NOTIFICACAO,
          dataEmissao: '2026-05-19',
          descricao: 'Entulho no passeio.',
          lavradoPorUsuarioId: 'u1',
        },
      ],
    });
    expect(eventos[0].tipo).toBe(TipoEventoTimeline.EMBARGO);
    expect(eventos[1].tipo).toBe(TipoEventoTimeline.AUTO);
  });

  it('no mesmo dia, a consequencia (auto) aparece acima da causa (visita)', () => {
    const eventos = montarTimeline({
      ...vazia(),
      fiscalizacoes: [
        {
          id: 'f1',
          numero: 'FIS-2026-0024',
          tipo: 'ENTULHO',
          resultado: ResultadoFiscalizacao.IRREGULAR,
          etapaConstatada: null,
          dataFiscalizacao: '2026-05-19',
          fiscalUsuarioId: 'u1',
        },
      ],
      autos: [
        {
          id: 'a1',
          numero: 'AI-2026-0044',
          tipo: TipoAutoInfracao.NOTIFICACAO,
          dataEmissao: '2026-05-19',
          descricao: 'Entulho no passeio.',
          lavradoPorUsuarioId: 'u1',
        },
      ],
    });
    expect(eventos.map((e) => e.registroId)).toEqual(['a1', 'f1']);
  });

  it('distingue alvara registrado de pedido indeferido', () => {
    const eventos = montarTimeline({
      ...vazia(),
      alvaras: [
        {
          id: 'al1',
          numero: null,
          ano: 2026,
          motivo: 'PRORROGACAO',
          situacao: SituacaoRegistroAlvara.INDEFERIDO,
          dataEmissao: '2026-02-21',
          criadoEm: new Date('2026-02-21T10:00:00Z'),
        },
      ],
    });
    expect(eventos[0].titulo).toContain('indeferido');
  });

  it('usa criadoEm como data quando o registro nao tem data propria', () => {
    const eventos = montarTimeline({
      ...vazia(),
      habiteSe: [
        {
          id: 'h1',
          numero: 'Habite-se no 27/2026',
          resultado: 'APROVADO',
          parcial: true,
          dataEmissao: null,
          criadoEm: new Date('2026-08-10T12:00:00Z'),
          vistoriadorUsuarioId: 'u2',
        },
      ],
    });
    expect(eventos[0].data).toBe('2026-08-10T12:00:00.000Z');
    expect(eventos[0].titulo).toContain('parcial');
  });

  it('inclui observacao livre do fiscal', () => {
    const eventos = montarTimeline({
      ...vazia(),
      observacoes: [
        {
          id: 'o1',
          texto: 'Inicio de obra comunicado no balcao.',
          autorUsuarioId: 'u3',
          criadoEm: new Date('2026-03-03T08:30:00Z'),
        },
      ],
    });
    expect(eventos[0].tipo).toBe(TipoEventoTimeline.OBSERVACAO);
    expect(eventos[0].resumo).toBe('Inicio de obra comunicado no balcao.');
  });

  it('obra sem nenhum registro tem timeline vazia', () => {
    expect(montarTimeline(vazia())).toEqual([]);
  });
});

describe('stepper de etapas (decisao 10)', () => {
  it('sem visitas, nenhuma etapa e atual ou concluida', () => {
    const etapas = montarEtapas([]);
    expect(etapas).toHaveLength(ORDEM_ETAPAS.length);
    expect(etapas.every((e) => !e.atual && !e.concluida && e.data === null)).toBe(
      true,
    );
  });

  it('marca como atual a etapa da visita mais recente', () => {
    const etapas = montarEtapas([
      {
        dataFiscalizacao: '2026-03-04',
        etapaConstatada: EtapaObraPrivada.FUNDACAO,
      },
      {
        dataFiscalizacao: '2026-07-22',
        etapaConstatada: EtapaObraPrivada.INSTALACOES,
      },
    ]);
    const atual = etapas.find((e) => e.atual);
    expect(atual?.etapa).toBe(EtapaObraPrivada.INSTALACOES);
  });

  it('marca como concluidas as etapas anteriores a atual', () => {
    const etapas = montarEtapas([
      {
        dataFiscalizacao: '2026-07-22',
        etapaConstatada: EtapaObraPrivada.INSTALACOES,
      },
    ]);
    const concluidas = etapas.filter((e) => e.concluida).map((e) => e.etapa);
    expect(concluidas).toEqual([
      EtapaObraPrivada.NAO_INICIADA,
      EtapaObraPrivada.FUNDACAO,
      EtapaObraPrivada.ESTRUTURA,
      EtapaObraPrivada.ALVENARIA,
      EtapaObraPrivada.COBERTURA,
    ]);
  });

  it('usa a PRIMEIRA visita que constatou a etapa como data', () => {
    const etapas = montarEtapas([
      {
        dataFiscalizacao: '2026-06-02',
        etapaConstatada: EtapaObraPrivada.ALVENARIA,
      },
      {
        dataFiscalizacao: '2026-06-20',
        etapaConstatada: EtapaObraPrivada.ALVENARIA,
      },
    ]);
    const alvenaria = etapas.find(
      (e) => e.etapa === EtapaObraPrivada.ALVENARIA,
    );
    expect(alvenaria?.data).toBe('2026-06-02');
  });

  it('regride a etapa atual se a ultima visita constatou etapa anterior', () => {
    const etapas = montarEtapas([
      {
        dataFiscalizacao: '2026-07-22',
        etapaConstatada: EtapaObraPrivada.INSTALACOES,
      },
      {
        dataFiscalizacao: '2026-08-05',
        etapaConstatada: EtapaObraPrivada.ESTRUTURA,
      },
    ]);
    expect(etapas.find((e) => e.atual)?.etapa).toBe(EtapaObraPrivada.ESTRUTURA);
  });

  it('ignora visitas sem etapa constatada', () => {
    const etapas = montarEtapas([
      { dataFiscalizacao: '2026-08-05', etapaConstatada: null },
      {
        dataFiscalizacao: '2026-03-04',
        etapaConstatada: EtapaObraPrivada.FUNDACAO,
      },
    ]);
    expect(etapas.find((e) => e.atual)?.etapa).toBe(EtapaObraPrivada.FUNDACAO);
  });
});
