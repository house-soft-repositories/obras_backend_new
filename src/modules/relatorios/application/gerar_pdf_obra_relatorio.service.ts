import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import { gerarPdfSimples } from '@/modules/relatorios/infra/reporting/pdf_simples';
import {
  RelatorioArquivo,
  LinhaObraRelatorio,
} from '@/modules/relatorios/domain/relatorios/relatorios_read_models';
import { SecaoRelatorio } from '@/modules/relatorios/domain/relatorios/exportar_lista_obras';
import IGerarPdfObraRelatorioUseCase, {
  GerarPdfObraRelatorioParam,
} from '@/modules/relatorios/domain/usecase/gerar_pdf_obra_relatorio.usecase';
import RelatoriosServiceException from '@/modules/relatorios/exceptions/relatorios_service.exception';
import RelatoriosQuery from '@/modules/relatorios/infra/query/relatorios_query';
import FluxoFisicoFinanceiroRelatorioService from '@/modules/relatorios/application/fluxo_fisico_financeiro_relatorio.service';

function formatarMoeda(valor: string): string {
  return Number(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function texto(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  if (value instanceof Date) return value.toISOString();
  return JSON.stringify(value);
}

export default class GerarPdfObraRelatorioService implements IGerarPdfObraRelatorioUseCase {
  constructor(
    private readonly query: RelatoriosQuery,
    private readonly fluxo: FluxoFisicoFinanceiroRelatorioService,
  ) {}

  async execute(
    param: GerarPdfObraRelatorioParam,
  ): AsyncResult<AppException, RelatorioArquivo> {
    return this.gerar(param, 'relatorio');
  }

  async gerarDossie(
    param: GerarPdfObraRelatorioParam,
  ): AsyncResult<AppException, RelatorioArquivo> {
    return this.gerar(param, 'dossie');
  }

  private async gerar(
    param: GerarPdfObraRelatorioParam,
    tipo: 'relatorio' | 'dossie',
  ): AsyncResult<AppException, RelatorioArquivo> {
    try {
      const linha = (await this.query.carregarLinhas(param.usuarioId)).find(
        (item) => item.obraId === param.obraId,
      );
      if (!linha) return left(this.notFound());
      const detalhe = await this.query.carregarDetalheObra(param.obraId);
      const fluxo = await this.fluxo.execute({
        usuarioId: param.usuarioId,
        obraId: param.obraId,
      });
      if (fluxo.isLeft()) return left(fluxo.value);
      const secoes = this.montarSecoes(
        linha,
        detalhe.estagios,
        detalhe.medicoes,
        fluxo.value,
        tipo,
      );
      const prefixo = tipo === 'dossie' ? 'dossie' : 'obra';
      return right({
        buffer: gerarPdfSimples(
          tipo === 'dossie' ? 'Dossie da Obra' : 'Relatorio da Obra',
          `${linha.codigo} · ${linha.nome}`,
          secoes,
        ),
        filename: `${prefixo}-${linha.codigo}.pdf`,
        contentType: 'application/pdf',
      });
    } catch (error) {
      if (error instanceof AppException) return left(error);
      return left(
        new RelatoriosServiceException({
          code: ErrorCodeConstants.RELATORIO_SERVICE_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }

  private montarSecoes(
    linha: LinhaObraRelatorio,
    estagios: Record<string, unknown>[],
    medicoes: Record<string, unknown>[],
    fluxo: {
      totalContratado: string;
      medidoTotal: string;
      empenhadoTotal: string;
      liquidadoTotal: string;
      pagoTotal: string;
      percentualFinanceiro: number;
      percentualFisico: number;
    },
    tipo: 'relatorio' | 'dossie',
  ): SecaoRelatorio[] {
    const secoes: SecaoRelatorio[] = [
      {
        titulo: 'Dados cadastrais',
        linhas: [
          `Codigo: ${linha.codigo}`,
          `Nome: ${linha.nome}`,
          `Status: ${linha.statusObra}`,
          `Tipo: ${linha.tipo}`,
          `Orgao: ${linha.orgaoNome ?? '-'}`,
          `Localidade: ${linha.localidadeNome ?? '-'}`,
          `Responsavel: ${linha.responsavelNome ?? '-'}`,
          `Prioritaria: ${linha.prioritaria ? 'Sim' : 'Nao'}`,
        ],
      },
      {
        titulo: 'Cronograma',
        linhas: estagios.length
          ? estagios.map(
              (estagio) =>
                `${texto(estagio.nome) || '-'} — ${Number(estagio.percentual_direto ?? 0)}% — prazo ${texto(estagio.data_fim) || '-'}`,
            )
          : ['Sem estagios cadastrados'],
      },
      {
        titulo: 'Medicoes',
        linhas: medicoes.length
          ? medicoes.map(
              (medicao) =>
                `#${texto(medicao.numero) || '-'} ${texto(medicao.tipo) || '-'} ${texto(medicao.data) || '-'} — ${formatarMoeda(texto(medicao.valor) || '0')}`,
            )
          : ['Sem medicoes cadastradas'],
      },
      {
        titulo: 'Execucao financeira',
        linhas: [
          `Total contratado: ${formatarMoeda(fluxo.totalContratado)}`,
          `Medido: ${formatarMoeda(fluxo.medidoTotal)}`,
          `Empenhado: ${formatarMoeda(fluxo.empenhadoTotal)}`,
          `Liquidado: ${formatarMoeda(fluxo.liquidadoTotal)}`,
          `Pago: ${formatarMoeda(fluxo.pagoTotal)} (${fluxo.percentualFinanceiro}%)`,
          `Percentual fisico: ${fluxo.percentualFisico}%`,
        ],
      },
    ];
    if (tipo === 'dossie') {
      secoes.push({
        titulo: 'Localizacoes',
        linhas: linha.localizacoes.length
          ? linha.localizacoes.map(
              (localizacao) =>
                `${localizacao.localidade}/${localizacao.uf} — ${localizacao.latitude ?? '-'} / ${localizacao.longitude ?? '-'}`,
            )
          : ['Sem localizacoes cadastradas'],
      });
    }
    return secoes;
  }

  private notFound(): RelatoriosServiceException {
    return new RelatoriosServiceException({
      code: ErrorCodeConstants.RELATORIO_NOT_FOUND,
      statusCode: 404,
    });
  }
}
