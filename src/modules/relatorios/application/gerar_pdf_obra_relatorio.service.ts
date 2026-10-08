import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import { gerarPdfSimples } from '@/modules/relatorios/infra/reporting/pdf_simples';
import {
  EstagioDetalheRelatorio,
  MedicaoDetalheRelatorio,
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
import type IDossieObraRepository from '@/modules/relatorios/adapters/dossie_obra_repository.interface';
import type IPdfRenderer from '@/modules/relatorios/adapters/pdf_renderer.interface';
import type IStorageService from '@/modules/storage/adapters/storage_service.interface';
import {
  MAX_BYTES_TOTAL_DOSSIE,
  MAX_FOTOS_DOSSIE,
  montarSecoesDossieObra,
  type FotoOrigemDossie,
  type FotoProntaDossie,
} from '@/modules/relatorios/domain/relatorios/dossie_obra';
import { montarHtmlDossie } from '@/modules/relatorios/infra/reporting/dossie_obra_html';
import { isChromiumIndisponivel } from '@/modules/relatorios/infra/reporting/chromium_erro';

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
    private readonly renderer: IPdfRenderer,
    private readonly storage: IStorageService,
    private readonly dossieRepo: IDossieObraRepository,
  ) {}

  async execute(
    param: GerarPdfObraRelatorioParam,
  ): AsyncResult<AppException, RelatorioArquivo> {
    return this.gerar(param);
  }

  async gerarDossie(
    param: GerarPdfObraRelatorioParam,
  ): AsyncResult<AppException, RelatorioArquivo> {
    try {
      const linha = (await this.query.carregarLinhas(param.usuarioId)).find(
        (item) => item.obraId === param.obraId,
      );
      // Passa pela lista para herdar a visibilidade por perfil: uma obra que
      // o usuário não vê na lista não pode sair em dossiê.
      if (!linha) return left(this.notFound());
      const carregado = await this.dossieRepo.carregar(param.obraId);
      if (carregado.isLeft()) return left(carregado.value);
      if (!carregado.value) return left(this.notFound());
      const fluxo = await this.fluxo.execute({
        usuarioId: param.usuarioId,
        obraId: param.obraId,
      });
      if (fluxo.isLeft()) return left(fluxo.value);
      const secoes = montarSecoesDossieObra({
        ...carregado.value.dossie,
        fluxo: fluxo.value,
      });
      // Uma foto que falhe ao baixar é apenas pulada (contada em omitidas):
      // um anexo incompleto é melhor do que um relatório que não sai.
      const { fotos, omitidas } = await this.prepararFotos(carregado.value.fotos);
      const subtitulo = `${carregado.value.dossie.obra.codigo} · ${carregado.value.dossie.obra.nome}`;
      const html = montarHtmlDossie({
        titulo: 'Dossiê da Obra',
        subtitulo,
        secoes,
        fotos,
        omitidas,
      });
      let buffer: Buffer;
      try {
        buffer = await this.renderer.renderHtml(html);
      } catch (error) {
        // Sem Chromium disponível, o dossiê sai em texto (com a relação de
        // fotos) em vez de falhar com 500. Qualquer outro erro de render
        // propaga como 500 para não mascarar falhas reais.
        if (!isChromiumIndisponivel(error)) throw error;
        buffer = gerarPdfSimples('Dossie da Obra', subtitulo, [
          ...secoes,
          this.secaoAnexoTexto(fotos, omitidas),
        ]);
      }
      return right({
        buffer,
        filename: `dossie-${linha.codigo}.pdf`,
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

  /**
   * Baixa as fotos do bucket por storageKey respeitando os guarda-corpos
   * (quantidade e bytes totais). Falhas individuais viram omitidas.
   */
  private async prepararFotos(
    origens: FotoOrigemDossie[],
  ): Promise<{ fotos: FotoProntaDossie[]; omitidas: number }> {
    const fotos: FotoProntaDossie[] = [];
    let bytes = 0;
    let omitidas = 0;
    for (const origem of origens) {
      if (fotos.length >= MAX_FOTOS_DOSSIE || bytes >= MAX_BYTES_TOTAL_DOSSIE) {
        omitidas += 1;
        continue;
      }
      const baixado = await this.storage.getObject(origem.storageKey);
      if (baixado.isLeft()) {
        omitidas += 1;
        continue;
      }
      if (bytes + baixado.value.length > MAX_BYTES_TOTAL_DOSSIE) {
        omitidas += 1;
        continue;
      }
      bytes += baixado.value.length;
      fotos.push({
        dataUri: `data:${origem.mimeType ?? 'image/jpeg'};base64,${baixado.value.toString('base64')}`,
        legenda: origem.legenda,
        data: origem.data,
      });
    }
    return { fotos, omitidas };
  }

  private secaoAnexoTexto(
    fotos: FotoProntaDossie[],
    omitidas: number,
  ): SecaoRelatorio {
    const linhas = fotos.map(
      (foto, indice) => `${indice + 1}. ${foto.legenda} (${foto.data || '-'})`,
    );
    if (omitidas > 0) {
      linhas.push(
        `${omitidas} foto(s) omitida(s) — o anexo com imagens sai apenas no PDF gerado com Chromium.`,
      );
    }
    return {
      titulo: 'Anexo fotografico',
      linhas: linhas.length
        ? linhas
        : ['Sem fotos cadastradas para esta obra.'],
    };
  }

  private async gerar(
    param: GerarPdfObraRelatorioParam,
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
      );
      return right({
        buffer: gerarPdfSimples(
          'Relatorio da Obra',
          `${linha.codigo} · ${linha.nome}`,
          secoes,
        ),
        filename: `obra-${linha.codigo}.pdf`,
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
    estagios: EstagioDetalheRelatorio[],
    medicoes: MedicaoDetalheRelatorio[],
    fluxo: {
      totalContratado: string;
      medidoTotal: string;
      empenhadoTotal: string;
      liquidadoTotal: string;
      pagoTotal: string;
      percentualFinanceiro: number;
      percentualFisico: number;
    },
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
    return secoes;
  }

  private notFound(): RelatoriosServiceException {
    return new RelatoriosServiceException({
      code: ErrorCodeConstants.RELATORIO_NOT_FOUND,
      statusCode: 404,
    });
  }
}
