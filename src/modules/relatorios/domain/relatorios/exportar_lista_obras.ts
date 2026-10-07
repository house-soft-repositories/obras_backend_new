import {
  ItemListaObrasRelatorio,
  RelatorioArquivo,
} from '@/modules/relatorios/domain/relatorios/relatorios_read_models';
import { gerarPdfSimples } from '@/modules/relatorios/infra/reporting/pdf_simples';

export type SecaoRelatorio = {
  titulo: string;
  linhas: string[];
};

const SEP = ';';

const colunasLista: {
  titulo: string;
  valor: (item: ItemListaObrasRelatorio) => string;
}[] = [
  { titulo: 'Codigo', valor: (item) => item.codigo },
  { titulo: 'Nome', valor: (item) => item.nome },
  { titulo: 'Status', valor: (item) => item.statusObra },
  { titulo: 'Estagio atual', valor: (item) => item.estagioAtualNome ?? '' },
  {
    titulo: 'Prazo estagio',
    valor: (item) => item.prazoConclusaoEstagio ?? '',
  },
  { titulo: '% Realizado', valor: (item) => String(item.percentualRealizado) },
  {
    titulo: '% Financeiro',
    valor: (item) => String(item.percentualFinanceiro),
  },
  { titulo: 'Semaforo', valor: (item) => item.semaforo ?? '' },
  { titulo: 'Orgao', valor: (item) => item.orgaoNome ?? '' },
  { titulo: 'Localidade', valor: (item) => item.localidadeNome ?? '' },
  { titulo: 'Responsavel', valor: (item) => item.responsavelNome ?? '' },
  { titulo: 'Empresa executora', valor: (item) => item.empresaExecutora ?? '' },
  { titulo: 'Contrato', valor: (item) => item.numeroContrato ?? '' },
  {
    titulo: 'Prioritaria',
    valor: (item) => (item.prioritaria ? 'Sim' : 'Nao'),
  },
  { titulo: 'Tags', valor: (item) => item.tags.join(' ') },
  { titulo: 'Criada em', valor: (item) => item.dataCriacao.slice(0, 10) },
];

function escaparCsv(valor: string): string {
  const seguro = /^[=+\-@\t\r]/.test(valor) ? `'${valor}` : valor;
  if (!/[";\r\n]/.test(seguro)) return seguro;
  return `"${seguro.replace(/"/g, '""')}"`;
}

export function gerarCsvListaObras(itens: ItemListaObrasRelatorio[]): string {
  const linhas = [colunasLista.map((coluna) => coluna.titulo).join(SEP)];
  for (const item of itens) {
    linhas.push(
      colunasLista.map((coluna) => escaparCsv(coluna.valor(item))).join(SEP),
    );
  }
  return '\uFEFF' + linhas.join('\r\n') + '\r\n';
}

export function montarSecoesListaObras(
  itens: ItemListaObrasRelatorio[],
  total = itens.length,
): SecaoRelatorio[] {
  const truncado = total > itens.length;
  return [
    {
      titulo: 'Lista de Obras',
      linhas: [
        `Total: ${total} obra(s)`,
        ...(truncado
          ? [`Exibindo primeiras ${itens.length} obra(s) da exportacao.`]
          : []),
        ...itens.map(
          (item) =>
            `${item.codigo} — ${item.nome} — ${item.statusObra} (${item.percentualRealizado}%) — ${item.orgaoNome ?? '-'} — ${item.responsavelNome ?? '-'}`,
        ),
      ],
    },
  ];
}

export function renderizarListaObras(
  formato: 'CSV' | 'PDF',
  itens: ItemListaObrasRelatorio[],
  total = itens.length,
): RelatorioArquivo {
  if (formato === 'PDF') {
    return {
      buffer: gerarPdfSimples(
        'Lista de Obras',
        `Total: ${total} obra(s)`,
        montarSecoesListaObras(itens, total),
      ),
      filename: 'obras.pdf',
      contentType: 'application/pdf',
    };
  }
  return {
    buffer: Buffer.from(gerarCsvListaObras(itens), 'utf8'),
    filename: 'obras.csv',
    contentType: 'text/csv; charset=utf-8',
  };
}
