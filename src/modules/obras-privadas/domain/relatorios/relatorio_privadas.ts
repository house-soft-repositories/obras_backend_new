import { contarPrazo } from '@/modules/obras-privadas/domain/prazo_auto_infracao';
import {
  ResultadoFiscalizacao,
  SituacaoAutoInfracao,
  TipoAutoInfracao,
  TipoFiscalizacao,
} from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';

export interface SecaoRelatorio {
  titulo: string;
  linhas: string[];
}

export interface DadosObraRelatorio {
  codigo: string;
  descricao: string;
  logradouro: string;
  numero: string | null;
  bairro: string | null;
  uf: string;
  inscricaoImobiliaria: string | null;
  matriculaRgi: string | null;
  latitude: string | null;
  longitude: string | null;
  situacaoAlvara: string | null;
  andamento: string | null;
  habiteSe: string | null;
  proprietarioNome: string;
  proprietarioDocumento: string;
}

export interface DadosFiscalizacaoRelatorio {
  numero: string;
  tipo: TipoFiscalizacao;
  dataFiscalizacao: string;
  resultado: ResultadoFiscalizacao;
  etapaConstatada: string | null;
  constatacoes: string | null;
  providencias: string | null;
  latitude: string | null;
  longitude: string | null;
  entulhoHaIrregularidade: boolean | null;
  entulhoVolumeEstimadoM3: string | null;
  entulhoLocal: string | null;
  entulhoPossuiCacamba: boolean | null;
  entulhoPossuiPgrcc: boolean | null;
  entulhoDestinacao: string | null;
}

export interface DadosAutoRelatorio {
  numero: string;
  tipo: TipoAutoInfracao;
  situacao: SituacaoAutoInfracao;
  dataEmissao: string;
  prazoDias: number | null;
  dataLimite: string | null;
  valorMulta: string | null;
  descricao: string;
  fiscalizacaoId: string | null;
}

export interface ItemListaObraPrivadaRelatorio {
  codigo: string;
  logradouro: string;
  numero: string | null;
  bairro: string | null;
  uf: string;
  proprietarioNome: string;
  proprietarioDocumento: string;
  situacaoAlvara: string;
  andamento: string | null;
  habiteSe: string | null;
  etapaAtual: string | null;
  ultimaVisitaEm: string | null;
  diasSemVisita: number | null;
  autuada: boolean;
  embargada: boolean;
}

export interface DadosDossie {
  obra: DadosObraRelatorio;
  alvaras: {
    numero: string | null;
    ano: number;
    tipo: string;
    motivo: string;
    situacao: string;
    dataEmissao: string | null;
    dataValidade: string | null;
    areaConstruidaAprovadaM2: string | null;
  }[];
  responsaveis: {
    nome: string | null;
    registro: string | null;
    papel: string;
    tipoDocumento: string;
    numeroDocumento: string;
    dataBaixa: string | null;
  }[];
  fiscalizacoes: DadosFiscalizacaoRelatorio[];
  autos: DadosAutoRelatorio[];
  habiteSe: {
    numero: string;
    dataEmissao: string | null;
    parcial: boolean;
    resultado: string;
    areaConstruidaExecutadaM2: string | null;
    divergenciaProjeto: boolean;
    divergenciaDescricao: string | null;
  }[];
  observacoes: { texto: string; criadoEm: Date }[];
}

const SEP = ';';

export function formatarData(iso: string | Date | null | undefined): string {
  // Colunas date/timestamptz podem chegar hidratadas como Date dependendo da
  // cadeia entidade→relatório; sem isso o dossiê quebra com
  // "iso.slice is not a function".
  const texto =
    iso instanceof Date
      ? (Number.isNaN(iso.getTime()) ? null : iso.toISOString().slice(0, 10))
      : iso;
  if (!texto) return '—';
  const [ano, mes, dia] = texto.slice(0, 10).split('-');
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : '—';
}

export function formatarArea(valor: string | null | undefined): string {
  if (!valor) return '—';
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return '—';
  return `${numero.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} m2`;
}

export function rotuloEnum(valor: string | null | undefined): string {
  if (!valor) return '—';
  const texto = valor.replace(/_/g, ' ').toLowerCase();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function enderecoCompleto(obra: DadosObraRelatorio): string {
  const partes = [obra.logradouro, obra.numero, obra.bairro].filter(Boolean);
  return `${partes.join(', ')} — ${obra.uf}`;
}

function simNao(valor: boolean | null | undefined): string {
  if (valor === null || valor === undefined) return '—';
  return valor ? 'Sim' : 'Nao';
}

export function secaoIdentificacao(obra: DadosObraRelatorio): SecaoRelatorio {
  return {
    titulo: 'Identificacao',
    linhas: [
      `Codigo: ${obra.codigo}`,
      `Endereco: ${enderecoCompleto(obra)}`,
      `Descricao: ${obra.descricao}`,
      `Inscricao imobiliaria: ${obra.inscricaoImobiliaria ?? '—'}`,
      `Matricula RGI: ${obra.matriculaRgi ?? '—'}`,
      `Coordenadas: ${obra.latitude ?? '—'} / ${obra.longitude ?? '—'}`,
      `Proprietario: ${obra.proprietarioNome} (${obra.proprietarioDocumento})`,
      `Situacao do alvara: ${rotuloEnum(obra.situacaoAlvara)}`,
      `Andamento: ${rotuloEnum(obra.andamento)}`,
      `Habite-se: ${rotuloEnum(obra.habiteSe)}`,
    ],
  };
}

export function linhaAuto(auto: DadosAutoRelatorio): string {
  const prazo = contarPrazo(auto);
  const multa = auto.valorMulta
    ? ` — multa R$ ${Number(auto.valorMulta).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : '';
  const limite = auto.dataLimite
    ? ` — limite ${formatarData(auto.dataLimite)}${prazo.rotulo ? ` (${prazo.rotulo})` : ''}`
    : '';
  return `${auto.numero} — ${rotuloEnum(auto.tipo)} — ${rotuloEnum(auto.situacao)} — emitido em ${formatarData(auto.dataEmissao)}${limite}${multa}`;
}

export function montarSecoesFiscalizacao(
  obra: DadosObraRelatorio,
  fiscalizacao: DadosFiscalizacaoRelatorio,
  autos: DadosAutoRelatorio[],
): SecaoRelatorio[] {
  const secoes: SecaoRelatorio[] = [
    secaoIdentificacao(obra),
    {
      titulo: 'Dados da fiscalizacao',
      linhas: [
        `Numero: ${fiscalizacao.numero}`,
        `Data: ${formatarData(fiscalizacao.dataFiscalizacao)}`,
        `Tipo: ${rotuloEnum(fiscalizacao.tipo)}`,
        `Resultado: ${rotuloEnum(fiscalizacao.resultado)}`,
        `Etapa constatada: ${rotuloEnum(fiscalizacao.etapaConstatada)}`,
        `Coordenadas da visita: ${fiscalizacao.latitude ?? '—'} / ${fiscalizacao.longitude ?? '—'}`,
      ],
    },
    {
      titulo: 'Constatacoes',
      linhas: [
        fiscalizacao.constatacoes?.trim() || 'Sem constatacoes registradas.',
      ],
    },
    {
      titulo: 'Providencias',
      linhas: [
        fiscalizacao.providencias?.trim() || 'Sem providencias registradas.',
      ],
    },
  ];

  if (fiscalizacao.tipo === TipoFiscalizacao.ENTULHO) {
    secoes.push({
      titulo: 'Entulho e residuos',
      linhas: [
        `Ha irregularidade: ${simNao(fiscalizacao.entulhoHaIrregularidade)}`,
        `Volume estimado: ${fiscalizacao.entulhoVolumeEstimadoM3 ? `${fiscalizacao.entulhoVolumeEstimadoM3} m3` : '—'}`,
        `Local: ${rotuloEnum(fiscalizacao.entulhoLocal)}`,
        `Possui cacamba: ${simNao(fiscalizacao.entulhoPossuiCacamba)}`,
        `Possui PGRCC: ${simNao(fiscalizacao.entulhoPossuiPgrcc)}`,
        `Destinacao: ${fiscalizacao.entulhoDestinacao ?? '—'}`,
      ],
    });
  }

  secoes.push({
    titulo: 'Autos lavrados a partir desta visita',
    linhas: autos.length
      ? autos.map(linhaAuto)
      : ['Nenhum auto lavrado nesta visita.'],
  });

  return secoes;
}

export function montarSecoesDossie(dossie: DadosDossie): SecaoRelatorio[] {
  return [
    secaoIdentificacao(dossie.obra),
    {
      titulo: 'Alvaras',
      linhas: dossie.alvaras.length
        ? dossie.alvaras.map(
            (alvara) =>
              `${alvara.numero ? `${alvara.numero}/${alvara.ano}` : `(sem numero)/${alvara.ano}`} — ${rotuloEnum(alvara.tipo)} — ${rotuloEnum(alvara.motivo)} — ${rotuloEnum(alvara.situacao)} — emissao ${formatarData(alvara.dataEmissao)} — validade ${formatarData(alvara.dataValidade)} — area aprovada ${formatarArea(alvara.areaConstruidaAprovadaM2)}`,
          )
        : ['OBRA SEM ALVARA REGISTRADO.'],
    },
    {
      titulo: 'Responsaveis tecnicos',
      linhas: dossie.responsaveis.length
        ? dossie.responsaveis.map(
            (responsavel) =>
              `${responsavel.nome ?? '—'} (${responsavel.registro ?? '—'}) — ${rotuloEnum(responsavel.papel)} — ${responsavel.tipoDocumento} ${responsavel.numeroDocumento}${responsavel.dataBaixa ? ` — baixado em ${formatarData(responsavel.dataBaixa)}` : ' — vigente'}`,
          )
        : ['Nenhum responsavel tecnico informado.'],
    },
    {
      titulo: 'Fiscalizacoes',
      linhas: dossie.fiscalizacoes.length
        ? dossie.fiscalizacoes.map(
            (fiscalizacao) =>
              `${fiscalizacao.numero} — ${formatarData(fiscalizacao.dataFiscalizacao)} — ${rotuloEnum(fiscalizacao.tipo)} — ${rotuloEnum(fiscalizacao.resultado)}${fiscalizacao.etapaConstatada ? ` — etapa ${rotuloEnum(fiscalizacao.etapaConstatada)}` : ''}`,
          )
        : ['Nenhuma fiscalizacao registrada.'],
    },
    {
      titulo: 'Autos e notificacoes',
      linhas: dossie.autos.length
        ? dossie.autos.map(linhaAuto)
        : ['Nenhum auto lavrado.'],
    },
    {
      titulo: 'Habite-se',
      linhas: dossie.habiteSe.length
        ? dossie.habiteSe.flatMap((habiteSe) => {
            const base = `${habiteSe.numero} — ${habiteSe.parcial ? 'parcial' : 'total'} — ${rotuloEnum(habiteSe.resultado)} — emissao ${formatarData(habiteSe.dataEmissao)} — area executada ${formatarArea(habiteSe.areaConstruidaExecutadaM2)}`;
            return habiteSe.divergenciaProjeto
              ? [
                  base,
                  `   DIVERGENCIA: ${habiteSe.divergenciaDescricao ?? 'nao descrita'}`,
                ]
              : [base];
          })
        : ['Habite-se nao emitido.'],
    },
    {
      titulo: 'Observacoes',
      linhas: dossie.observacoes.length
        ? dossie.observacoes.map(
            (observacao) =>
              `${observacao.criadoEm.toISOString().slice(0, 10).split('-').reverse().join('/')} — ${observacao.texto}`,
          )
        : ['Sem observacoes.'],
    },
  ];
}

const colunasLista: {
  titulo: string;
  valor: (item: ItemListaObraPrivadaRelatorio) => string;
}[] = [
  { titulo: 'Codigo', valor: (item) => item.codigo },
  {
    titulo: 'Endereco',
    valor: (item) => [item.logradouro, item.numero].filter(Boolean).join(', '),
  },
  { titulo: 'Bairro', valor: (item) => item.bairro ?? '' },
  { titulo: 'UF', valor: (item) => item.uf },
  { titulo: 'Proprietario', valor: (item) => item.proprietarioNome },
  { titulo: 'Documento', valor: (item) => item.proprietarioDocumento },
  {
    titulo: 'Situacao do alvara',
    valor: (item) => rotuloEnum(item.situacaoAlvara),
  },
  { titulo: 'Andamento', valor: (item) => rotuloEnum(item.andamento) },
  { titulo: 'Habite-se', valor: (item) => rotuloEnum(item.habiteSe) },
  { titulo: 'Etapa', valor: (item) => rotuloEnum(item.etapaAtual) },
  {
    titulo: 'Ultima visita',
    valor: (item) => formatarData(item.ultimaVisitaEm),
  },
  {
    titulo: 'Dias sem visita',
    valor: (item) =>
      item.diasSemVisita === null ? '' : String(item.diasSemVisita),
  },
  { titulo: 'Autuada', valor: (item) => (item.autuada ? 'Sim' : 'Nao') },
  { titulo: 'Embargada', valor: (item) => (item.embargada ? 'Sim' : 'Nao') },
];

function escaparCsv(valor: string): string {
  const seguro = /^[=+\-@\t\r]/.test(valor) ? `'${valor}` : valor;
  if (!/[";\r\n]/.test(seguro)) return seguro;
  return `"${seguro.replace(/"/g, '""')}"`;
}

export function gerarCsvLista(itens: ItemListaObraPrivadaRelatorio[]): string {
  const linhas = [colunasLista.map((coluna) => coluna.titulo).join(SEP)];
  for (const item of itens) {
    linhas.push(
      colunasLista.map((coluna) => escaparCsv(coluna.valor(item))).join(SEP),
    );
  }
  return '\uFEFF' + linhas.join('\r\n') + '\r\n';
}

export function montarSecoesLista(
  itens: ItemListaObraPrivadaRelatorio[],
  total: number = itens.length,
): SecaoRelatorio[] {
  const truncado = total > itens.length;
  return [
    {
      titulo: 'Obras Privadas',
      linhas: [
        `Total: ${total} obra(s)`,
        ...(truncado
          ? [`Exibindo primeiras ${itens.length} obra(s) da exportacao.`]
          : []),
        ...itens.map(
          (item) =>
            `${item.codigo} — ${[item.logradouro, item.numero].filter(Boolean).join(', ')} — ${item.proprietarioNome} (${item.proprietarioDocumento}) — ${rotuloEnum(item.situacaoAlvara)} — ${rotuloEnum(item.andamento)}${item.autuada ? ' — AUTUADA' : ''}${item.embargada ? ' — EMBARGADA' : ''} — ultima visita ${formatarData(item.ultimaVisitaEm)}`,
        ),
      ],
    },
  ];
}
